import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, Moon, Sun, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NutritionProgress from '@/components/NutritionProgress';
import MascotImage from '@/components/MascotImage';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useProfile } from '@/hooks/use-profile';
import { useRecords } from '@/hooks/use-records';
import { MEAL_OPTIONS } from '@/data/types';
import type { IRecordItem } from '@/data/types';
import { sumRecordItems, calcCalorieTarget, calcMacroTargets } from '@/lib/nutrition';
import { foodById } from '@/data/foods';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const TODAY_WEEKDAY = `周${WEEKDAYS[new Date().getDay()]}`;
const CHART_TEAL = '#15928B';
const CHART_ORANGE = '#E8892D';
const CHART_BLUE = '#4A7FB5';
const CHART_GOLD = '#D9A441';
const CHART_TRACK = '#DFEEEC';

const greetingOf = (hour: number): string => {
  if (hour >= 5 && hour < 11) return '早上好';
  if (hour >= 11 && hour < 14) return '中午好';
  if (hour >= 14 && hour < 18) return '下午好';
  if (hour >= 18 && hour < 23) return '晚上好';
  return '夜深了';
};

const shapeLabelOf = (bmi: number): string =>
  bmi < 18.5 ? '偏瘦' : bmi < 24 ? '标准' : bmi < 28 ? '微胖' : '偏胖';

export default function DashboardPage() {
  const { profile } = useProfile();
  const { dayRecords } = useRecords();
  const [now] = useState(() => new Date());
  const hour = now.getHours();

  const day = dayRecords(TODAY) ?? { date: TODAY, items: [] as IRecordItem[] };
  const totals = sumRecordItems(day.items);

  const target = profile ? calcCalorieTarget(profile) : null;
  const macros = profile ? calcMacroTargets(profile, target ?? 0) : null;

  const remaining = target ? Math.max(0, target - totals.kcal) : 0;
  const over = target ? totals.kcal - target : 0;
  const fullness = target && target > 0 ? totals.kcal / target : null;

  const bmi = profile ? profile.weight / (profile.height / 100) ** 2 : 22;
  const statusText = !profile
    ? '设置方案后，小人会随你的身高体重和饮食变化'
    : fullness === null
      ? '今天还没记录饮食'
      : fullness < 0.35
        ? '有点饿了，记得吃够营养'
        : fullness < 0.6
          ? '进食正常，保持节奏'
          : fullness <= 1.05
            ? '状态很好，稳稳控制中'
            : '今天吃超了，明天找回节奏';

  const donutData = target
    ? [
        { name: '已摄入', value: totals.kcal, color: totals.kcal <= target ? CHART_TEAL : CHART_ORANGE },
        { name: '剩余', value: remaining, color: CHART_TRACK },
      ]
    : [];

  const mealSummary = MEAL_OPTIONS.map((meal) => {
    const items = day.items.filter((i) => i.meal === meal);
    return { meal, items, kcal: sumRecordItems(items).kcal };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {TODAY} {TODAY_WEEKDAY}
          </p>
          <h1 className="mt-1 text-2xl font-bold">今日概况</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/records">
              <UtensilsCrossed className="mr-1.5 h-4 w-4" />
              记录饮食
            </Link>
          </Button>
          <Button asChild>
            <Link to="/foods">
              查食物热量
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 形象小人状态卡 */}
      <Card className="overflow-hidden bg-primary/[0.04]">
        <CardContent className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:justify-between sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {hour >= 6 && hour < 18 ? (
                <Sun className="h-4 w-4 text-accent-foreground/70" />
              ) : (
                <Moon className="h-4 w-4 text-accent-foreground/70" />
              )}
              {greetingOf(hour)}
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{statusText}</h2>
            {profile ? (
              <p className="mt-2 text-sm text-muted-foreground">
                身高 {profile.height}cm · 体重 {profile.weight}kg · BMI {bmi.toFixed(1)}（{shapeLabelOf(bmi)}）
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  去记录身高体重，让小人拥有你的体型
                </p>
                <Button asChild size="sm">
                  <Link to="/plan">去设置方案</Link>
                </Button>
              </div>
            )}
          </div>
          <MascotImage
            fullness={fullness ?? 0.5}
            hour={hour}
            className="h-44 w-auto shrink-0 object-contain drop-shadow-sm"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左列 */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>今日热量</CardTitle>
              <CardDescription>
                {target
                  ? over > 0
                    ? `已超出目标 ${over} 千卡`
                    : `还差 ${remaining} 千卡到目标`
                  : '设置方案后显示目标'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {target ? (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
                  <div className="relative h-52 w-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          innerRadius={68}
                          outerRadius={92}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {donutData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold">{totals.kcal}</p>
                      <p className="text-xs text-muted-foreground">/ {target} 千卡</p>
                    </div>
                  </div>
                  <div className="grid w-full max-w-xs grid-cols-3 gap-3 sm:grid-cols-1">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">已摄入</p>
                      <p className="text-lg font-bold">{totals.kcal} 千卡</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">目标</p>
                      <p className="text-lg font-bold">{target} 千卡</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">{over > 0 ? '已超出' : '还可摄入'}</p>
                      <p className={`text-lg font-bold ${over > 0 ? 'text-destructive' : 'text-primary'}`}>
                        {Math.abs(over > 0 ? over : remaining)} 千卡
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  到「我的方案」设置身高、体重和减脂目标
                </p>
              )}
            </CardContent>
          </Card>

          {profile && macros && (
            <Card>
              <CardHeader>
                <CardTitle>营养目标进度</CardTitle>
                <CardDescription>对比今日摄入与目标（克）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NutritionProgress
                  label="蛋白质"
                  value={totals.protein}
                  target={macros.protein}
                  unit="g"
                  color={CHART_BLUE}
                />
                <NutritionProgress
                  label="脂肪"
                  value={totals.fat}
                  target={macros.fat}
                  unit="g"
                  color={CHART_ORANGE}
                />
                <NutritionProgress
                  label="碳水化合物"
                  value={totals.carbs}
                  target={macros.carbs}
                  unit="g"
                  color={CHART_GOLD}
                />
                <NutritionProgress
                  label="膳食纤维"
                  value={totals.fiber}
                  target={28}
                  unit="g"
                  color={CHART_TEAL}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右列 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>今日餐次</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealSummary.map(({ meal, items, kcal }) => (
                <div key={meal} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{meal}</p>
                    <p className="text-xs text-muted-foreground">
                      {items.length === 0 ? '未记录' : items.map((i) => i.foodName).join('、')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{kcal} 千卡</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>今日记录明细</CardTitle>
            </CardHeader>
            <CardContent>
              {day.items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  今天还没有记录，去「饮食记录」添加吧
                </p>
              ) : (
                <ul className="space-y-2">
                  {day.items.slice(0, 8).map((item) => {
                    const food = foodById(item.foodId);
                    return (
                      <li key={item.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">
                          {item.foodName}
                          <span className="ml-1.5 text-xs text-muted-foreground">{item.grams}g</span>
                        </span>
                        <span className="ml-2 shrink-0 font-medium">{food ? Math.round((food.kcal * item.grams) / 100) : 0} 千卡</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

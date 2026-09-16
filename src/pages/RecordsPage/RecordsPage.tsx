import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NutritionProgress from '@/components/NutritionProgress';
import AddFoodDialog from '@/components/AddFoodDialog';
import EditRecordDialog from '@/components/EditRecordDialog';
import { useProfile } from '@/hooks/use-profile';
import { useRecords } from '@/hooks/use-records';
import { MEAL_OPTIONS } from '@/data/types';
import type { IFood, IRecordItem, MealType } from '@/data/types';
import { foodById } from '@/data/foods';
import { sumRecordItems, calcCalorieTarget, calcMacroTargets } from '@/lib/nutrition';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const CHART_ORANGE = '#E8892D';
const CHART_BLUE = '#4A7FB5';
const CHART_GOLD = '#D9A441';

/** 按当前时段推荐默认餐次 */
const mealForHour = (hour: number): MealType => {
  if (hour >= 5 && hour < 10) return '早餐';
  if (hour >= 10 && hour < 14) return '午餐';
  if (hour >= 14 && hour < 17) return '加餐';
  if (hour >= 17 && hour < 21) return '晚餐';
  return '加餐';
};

let seq = 0;
const genId = () => {
  seq += 1;
  return `${Date.now()}-${seq}`;
};

export default function RecordsPage() {
  const { profile } = useProfile();
  const { dayRecords, addItem, removeItem, updateItem } = useRecords();
  const [date, setDate] = useState(TODAY);
  const [now] = useState(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMeal, setPickerMeal] = useState<MealType>('早餐');
  const [pickerSeq, setPickerSeq] = useState(0);
  const [editItem, setEditItem] = useState<IRecordItem | null>(null);

  const day = dayRecords(date) ?? { date, items: [] };
  const totals = sumRecordItems(day.items);
  const target = profile ? calcCalorieTarget(profile) : null;
  const macros = profile && target ? calcMacroTargets(profile, target) : null;
  const isToday = date === TODAY;
  const remaining = target ? Math.max(0, target - totals.kcal) : 0;
  const over = target ? totals.kcal - target : 0;
  const weekDay = WEEKDAYS[parseISO(date).getDay()];

  const move = (dir: -1 | 1) => {
    const base = parseISO(date);
    setDate(format(dir === -1 ? subDays(base, 1) : addDays(base, 1), 'yyyy-MM-dd'));
  };

  const openPicker = (meal: MealType) => {
    setPickerMeal(meal);
    setPickerSeq((n) => n + 1);
    setPickerOpen(true);
  };

  const handleConfirm = (food: IFood, grams: number, meal: MealType) => {
    addItem(date, {
      id: genId(),
      foodId: food.id,
      foodName: food.name,
      grams,
      meal,
    });
    toast.success(`已记录：${food.name} ${grams}g（${meal}）`);
  };

  const handleDelete = (item: IRecordItem) => {
    removeItem(date, item.id);
    toast.success('已删除该记录', {
      action: {
        label: '撤销',
        onClick: () => {
          addItem(date, item);
          toast.success('已恢复记录');
        },
      },
    });
  };

  const handleSaveEdit = (itemId: string, grams: number, meal: MealType) => {
    updateItem(date, itemId, { grams, meal });
    toast.success('已更新记录');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">饮食记录</h1>
          <p className="mt-1 text-sm text-muted-foreground">按餐次记录，自动汇总热量与营养</p>
        </div>
        <Button onClick={() => openPicker(mealForHour(now.getHours()))}>
          <Plus className="mr-1.5 h-4 w-4" />
          添加食物
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="前一天">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-36 px-2 text-center">
          <p className="font-semibold">{format(parseISO(date), 'M月d日')}</p>
          <p className="text-xs text-muted-foreground">周{weekDay}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="后一天">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setDate(TODAY)}>
            回到今天
          </Button>
        )}
      </div>

      {!profile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              设置「我的方案」后，这里会显示每日热量和营养目标对比
            </p>
            <Button asChild size="sm">
              <Link to="/plan">去设置方案</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {target && (
        <Card>
          <CardHeader>
            <CardTitle>当日汇总</CardTitle>
            <CardDescription>
              {over > 0 ? `已超出目标 ${over} 千卡` : `还差 ${remaining} 千卡到目标`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">总摄入</p>
                <p className="text-xl font-bold">{totals.kcal} 千卡</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">目标</p>
                <p className="text-xl font-bold">{target} 千卡</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">{over > 0 ? '已超出' : '还可摄入'}</p>
                <p className={`text-xl font-bold ${over > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {Math.abs(over > 0 ? over : remaining)} 千卡
                </p>
              </div>
            </div>
            {macros && (
              <div className="grid gap-4 sm:grid-cols-3">
                <NutritionProgress label="蛋白质" value={totals.protein} target={macros.protein} unit="g" color={CHART_BLUE} />
                <NutritionProgress label="脂肪" value={totals.fat} target={macros.fat} unit="g" color={CHART_ORANGE} />
                <NutritionProgress label="碳水" value={totals.carbs} target={macros.carbs} unit="g" color={CHART_GOLD} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {MEAL_OPTIONS.map((meal) => {
          const items = day.items.filter((i) => i.meal === meal);
          const mealKcal = sumRecordItems(items).kcal;
          return (
            <Card key={meal}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{meal}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{mealKcal} 千卡</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => openPicker(meal)}
                      aria-label={`添加到${meal}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openPicker(meal)}
                    className="w-full rounded-lg border border-dashed py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
                  >
                    + 记录{meal}
                  </button>
                ) : (
                  <ul className="divide-y">
                    {items.map((item) => {
                      const food = foodById(item.foodId);
                      const kcal = food ? Math.round((food.kcal * item.grams) / 100) : 0;
                      return (
                        <li key={item.id} className="group flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.foodName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.grams}g · 蛋白 {food ? Math.round((food.protein * item.grams) / 100) : 0}g · 脂{' '}
                              {food ? Math.round((food.fat * item.grams) / 100) : 0}g
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="mr-1 text-sm font-medium">{kcal} 千卡</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => setEditItem(item)}
                              aria-label="修改记录"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(item)}
                              aria-label="删除记录"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddFoodDialog
        key={`${pickerMeal}-${pickerSeq}`}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onConfirm={handleConfirm}
        defaultMeal={pickerMeal}
      />
      <EditRecordDialog
        key={editItem?.id ?? 'closed'}
        open={editItem !== null}
        item={editItem}
        onOpenChange={(v) => {
          if (!v) setEditItem(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HeartPulse, Info, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useProfile } from '@/hooks/use-profile';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/data/types';
import type { ActivityLevel, Gender, Goal, IProfile } from '@/data/types';
import {
  calcBmr,
  calcCalorieTarget,
  calcMacroTargets,
  calcTdee,
} from '@/lib/nutrition';
import type { IPlanResult } from '@/lib/nutrition';

const schema = z.object({
  gender: z.enum(['male', 'female']),
  age: z
    .number('请输入年龄')
    .min(10, '年龄需在 10-100 之间')
    .max(100, '年龄需在 10-100 之间'),
  height: z
    .number('请输入身高')
    .min(120, '身高需在 120-250cm 之间')
    .max(250, '身高需在 120-250cm 之间'),
  weight: z
    .number('请输入体重')
    .min(30, '体重需在 30-300kg 之间')
    .max(300, '体重需在 30-300kg 之间'),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very']),
  goal: z.enum(['lose05', 'lose1', 'maintain', 'gain']),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  gender: 'female',
  age: 25,
  height: 165,
  weight: 60,
  activity: 'light',
  goal: 'lose05',
};

const buildResult = (p: IProfile): IPlanResult => {
  const bmr = calcBmr(p);
  const tdee = calcTdee(p);
  const calorieTarget = calcCalorieTarget(p);
  const macros = calcMacroTargets(p, calorieTarget);
  return { bmr, tdee, calorieTarget, ...macros, deficit: tdee - calorieTarget };
};

const goalNote = (goal: Goal): string => {
  if (goal === 'lose05') return '温和减脂 · 每周约减 0.5 kg';
  if (goal === 'lose1') return '快速减脂 · 每周约减 1 kg';
  if (goal === 'maintain') return '维持体重 · 收支平衡';
  return '增肌增重 · 每日约 300 千卡盈余';
};

export default function PlanPage() {
  const { profile, saveProfile } = useProfile();
  const [result, setResult] = useState<IPlanResult | null>(() =>
    profile ? buildResult(profile) : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: profile ?? DEFAULT_VALUES,
  });

  const proteinPct = result ? Math.round((result.protein * 4) / result.calorieTarget * 100) : 0;

  const onSubmit = (values: FormValues) => {
    const p: IProfile = { ...values };
    saveProfile(p);
    setResult(buildResult(p));
    toast.success('方案已保存，今日概况已同步更新');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">我的方案</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          根据基础代谢与活动量，计算每日热量和营养目标
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>身体数据</CardTitle>
            <CardDescription>输入你的基本情况，公式基于 Mifflin-St Jeor</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性别</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(v) => field.onChange(v as Gender)}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="female" id="gender-female" />
                            </FormControl>
                            <Label htmlFor="gender-female">女</Label>
                          </FormItem>
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="male" id="gender-male" />
                            </FormControl>
                            <Label htmlFor="gender-male">男</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>年龄</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? NaN : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>身高 cm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? NaN : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>体重 kg</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? NaN : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="activity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日常活动水平</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v as ActivityLevel)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_OPTIONS.map((a) => (
                              <SelectItem key={a.value} value={a.value}>
                                {a.label}（{a.desc}）
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>用于估算每日总消耗（TDEE）</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目标</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v as Goal)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOAL_OPTIONS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}（{g.desc}）
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <Save className="mr-1.5 h-4 w-4" />
                  计算并保存方案
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary" />
                    每日目标
                  </CardTitle>
                  <CardDescription>{goalNote(profile?.goal ?? 'maintain')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-primary/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">每日热量摄入目标</p>
                    <p className="mt-1 text-4xl font-bold text-primary">
                      {result.calorieTarget}
                      <span className="ml-1 text-base font-normal text-muted-foreground">千卡/天</span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {result.deficit > 0
                        ? `每日约 ${result.deficit} 千卡热量缺口`
                        : result.deficit < 0
                          ? `每日约 ${-result.deficit} 千卡热量盈余`
                          : '摄入与消耗基本持平'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">基础代谢 BMR</p>
                      <p className="text-lg font-bold">{result.bmr}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">每日消耗 TDEE</p>
                      <p className="text-lg font-bold">{result.tdee}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">BMI</p>
                      <p className="text-lg font-bold">
                        {profile ? ((profile.weight / (profile.height / 100) ** 2)).toFixed(1) : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>三大营养素目标（克/天）</CardTitle>
                  <CardDescription>按目标热量自动配比</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border-t-4 border-[#4A7FB5] bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">蛋白质</p>
                    <p className="text-xl font-bold">{result.protein}g</p>
                    <p className="text-xs text-muted-foreground">约 {proteinPct}% 热量</p>
                  </div>
                  <div className="rounded-xl border-t-4 border-[#E8892D] bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">脂肪</p>
                    <p className="text-xl font-bold">{result.fat}g</p>
                    <p className="text-xs text-muted-foreground">约 25% 热量</p>
                  </div>
                  <div className="rounded-xl border-t-4 border-[#D9A441] bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">碳水</p>
                    <p className="text-xl font-bold">{result.carbs}g</p>
                    <p className="text-xs text-muted-foreground">约 {100 - 25 - proteinPct}% 热量</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Info className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  填写左侧表单并保存，即可看到你的专属热量与营养目标
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-muted bg-muted/40">
            <CardContent className="p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">健康提醒：</span>
                女性每日摄入不建议低于 1200 千卡、男性不低于 1500 千卡；每周减重速度不宜超过 1
                kg。本工具提供的是估算参考，如有慢性病、孕期等情况，请以医生或注册营养师意见为准。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

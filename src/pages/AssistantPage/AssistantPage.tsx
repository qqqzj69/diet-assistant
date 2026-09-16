import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CalendarDays, Salad, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MascotImage from '@/components/MascotImage';
import FoodDetailDialog from '@/components/FoodDetailDialog';
import { useProfile } from '@/hooks/use-profile';
import { useRecords } from '@/hooks/use-records';
import type { IFood, MealType } from '@/data/types';
import { sumRecordItems, calcCalorieTarget, calcMacroTargets } from '@/lib/nutrition';
import { answerQuestion, QUICK_PROMPTS } from '@/lib/assistant';
import type { AssistantCtx } from '@/lib/assistant';
import { recommendFoods, mealPlanSuggestion, proteinOf } from '@/lib/recommend';

const TODAY = new Date().toISOString().slice(0, 10);

interface ChatMsg {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

let seq = 0;
const genId = () => {
  seq += 1;
  return `msg-${Date.now()}-${seq}`;
};

export default function AssistantPage() {
  const { profile } = useProfile();
  const { dayRecords, addItem } = useRecords();
  const today = dayRecords(TODAY) ?? { date: TODAY, items: [] };
  const totals = sumRecordItems(today.items);
  const target = profile ? calcCalorieTarget(profile) : null;
  const macros = profile && target ? calcMacroTargets(profile, target) : null;

  const ctx: AssistantCtx = {
    profile,
    totals,
    hasRecords: today.items.length > 0,
    target,
    macros,
  };

  const welcome =
    profile && target
      ? `你好呀，我是你的减脂小助手。\n你的目标热量约 ${target} 千卡/天，今天已记录 ${totals.kcal} 千卡。\n可以问我：食物热量、推荐吃什么、今日状态、减脂方法。`
      : '你好呀，我是你的减脂小助手。\n先去「我的方案」设置身高体重，我就能帮你算目标热量、推荐食物、核对每日摄入。\n现在也可以直接问我，比如「鸡胸肉多少热量？」';

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: genId(), role: 'bot', text: welcome },
  ]);
  const [input, setInput] = useState('');
  const [detailFood, setDetailFood] = useState<IFood | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { id: genId(), role: 'user', text }]);
    setInput('');
    const answer = answerQuestion(text, ctx);
    setTimeout(() => {
      setMessages((m) => [...m, { id: genId(), role: 'bot', text: answer }]);
    }, 120);
  };

  const remaining = target ? target - totals.kcal : 0;
  const proteinDeficit = macros ? macros.protein - totals.protein : 0;
  const fiberDeficit = 28 - totals.fiber;
  const recs = target ? recommendFoods({ remainingKcal: remaining, proteinDeficit, fiberDeficit }) : [];
  const plan = target ? mealPlanSuggestion(target) : [];

  const handleAddFromRec = (grams: number, meal: MealType) => {
    const food = detailFood;
    if (!food) return;
    addItem(TODAY, {
      id: genId(),
      foodId: food.id,
      foodName: food.name,
      grams,
      meal,
    });
    toast.success(`已记录：${food.name} ${grams}g（${meal}）`);
    setDetailFood(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bot className="h-6 w-6 text-primary" />
            智能助手
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            个性化推荐 + 对话问答，基于你的档案、记录和内置食物库
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          本地智能问答 · 离线可用
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 对话区 */}
        <Card className="lg:col-span-3">
          <CardContent className="flex h-[620px] flex-col p-4">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <div
                    key={msg.id}
                    className="ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div className="shrink-0 overflow-hidden rounded-full bg-primary/10 p-1">
                      <MascotImage
                        fullness={target ? totals.kcal / target : 0.5}
                        hour={new Date().getHours()}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-md bg-muted px-4 py-2.5 text-sm leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {p}
                </button>
              ))}
            </div>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="问点什么…比如「推荐我的午餐」"
                className="flex-1"
              />
              <Button type="submit" size="icon" aria-label="发送">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 右侧 */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                今日状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {target ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/60 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">摄入</p>
                      <p className="text-base font-bold">{totals.kcal}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">目标</p>
                      <p className="text-base font-bold">{target}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">蛋白</p>
                      <p className="text-base font-bold">
                        {totals.protein}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{macros?.protein}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {remaining >= 0
                      ? `还差 ${remaining} 千卡到目标，可参考下方推荐`
                      : `已超出 ${-remaining} 千卡，明天恢复正常节奏即可`}
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    设置身高体重后，这里会显示你的目标热量和今日对比
                  </p>
                  <Button asChild size="sm">
                    <Link to="/plan">去设置方案</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                今日推荐
              </CardTitle>
              <CardDescription>
                {target ? '按你今天的营养缺口和剩余热量匹配' : '设置方案后按你的需求匹配'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">先设置方案，再来看推荐</p>
              ) : (
                recs.map(({ food, reason }) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setDetailFood(food)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{food.name}</p>
                      <p className="mt-0.5 text-xs text-primary">{reason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{food.kcal}</p>
                      <p className="text-[10px] text-muted-foreground">千卡/100g</p>
                    </div>
                  </button>
                ))
              )}
              <p className="pt-1 text-xs text-muted-foreground">点击推荐食物可查看详情并直接记录</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Salad className="h-5 w-5 text-primary" />
                三餐参考
              </CardTitle>
              <CardDescription>
                {target ? `按约 ${target} 千卡/天自动配比` : '设置方案后自动生成'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">先设置方案，再来看参考</p>
              ) : (
                <>
                  {plan.map((m) => (
                    <div key={m.meal} className="rounded-xl bg-muted/50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{m.meal}</p>
                        <span className="text-xs font-medium text-primary">
                          ≈ {m.kcal} 千卡 · 蛋白 {proteinOf(m.items)}g
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {m.items.map((i) => `${i.name} ${i.grams}g`).join(' · ')}
                      </p>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    示例配比，主食份量已按你的目标自动调整，可按口味替换同类食物
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FoodDetailDialog
        food={detailFood}
        open={detailFood !== null}
        onOpenChange={(v) => {
          if (!v) setDetailFood(null);
        }}
        onAdd={handleAddFromRec}
      />
    </div>
  );
}

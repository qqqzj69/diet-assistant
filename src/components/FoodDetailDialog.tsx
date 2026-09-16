import { useState } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import RatingStars from './RatingStars';
import type { IFood, MealType } from '@/data/types';
import { MEAL_OPTIONS } from '@/data/types';
import { nutrientsFor } from '@/lib/nutrition';

interface FoodDetailDialogProps {
  food: IFood | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 传入时展示"记入今日饮食"操作 */
  onAdd?: (grams: number, meal: MealType) => void;
}

const NUTRIENT_BARS: { key: 'protein' | 'fat' | 'carbs'; label: string; color: string }[] = [
  { key: 'protein', label: '蛋白质', color: '#4A7FB5' },
  { key: 'fat', label: '脂肪', color: '#E8892D' },
  { key: 'carbs', label: '碳水', color: '#D9A441' },
];

export default function FoodDetailDialog({
  food,
  open,
  onOpenChange,
  onAdd,
}: FoodDetailDialogProps) {
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<MealType>('早餐');

  if (!food) return null;

  const n = nutrientsFor(food, grams);
  const maxBar = Math.max(30, food.protein, food.fat, food.carbs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{food.name}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{food.category}</Badge>
                <RatingStars rating={food.rating} />
                <span className="text-xs">推荐度 {food.rating}/5</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 每 100 克热量 */}
          <div className="flex items-end justify-between rounded-xl bg-muted/60 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">每 100 克热量</p>
              <p className="text-2xl font-bold text-foreground">
                {food.kcal}
                <span className="ml-1 text-sm font-normal text-muted-foreground">千卡</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              纤维 {food.fiber}g · GI 友好度以粗粮为佳
            </p>
          </div>

          {/* 三大营养素（每 100 克） */}
          <div className="space-y-2.5">
            {NUTRIENT_BARS.map((b) => (
              <div key={b.key} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-muted-foreground">{b.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (food[b.key] / maxBar) * 100)}%`, backgroundColor: b.color }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-medium">{food[b.key]}g</span>
              </div>
            ))}
          </div>

          {/* 优缺点 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success-foreground">
                <Check className="h-4 w-4 text-success" /> 优点
              </p>
              <ul className="space-y-1.5">
                {food.pros.map((p) => (
                  <li key={p} className="flex gap-1.5 text-sm leading-snug">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <X className="h-4 w-4 text-destructive" /> 缺点
              </p>
              <ul className="space-y-1.5">
                {food.cons.map((c) => (
                  <li key={c} className="flex gap-1.5 text-sm leading-snug">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 建议 */}
          <div className="flex gap-2 rounded-xl bg-primary/5 p-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-snug">
              <span className="font-semibold">减脂建议：</span>
              {food.advice}
            </p>
          </div>

          {/* 记入饮食 */}
          {onAdd && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">记入今日饮食</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="grams">食用量（克）</Label>
                  <Input
                    id="grams"
                    type="number"
                    min={1}
                    max={2000}
                    value={grams}
                    onChange={(e) => setGrams(Math.max(1, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>餐次</Label>
                  <Select value={meal} onValueChange={(v) => setMeal(v as MealType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_OPTIONS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                本份约 <span className="font-semibold text-foreground">{n.kcal} 千卡</span>（蛋白 {n.protein}g · 脂肪 {n.fat}g · 碳水 {n.carbs}g）
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {onAdd && (
            <Button
              onClick={() => {
                onAdd(grams, meal);
                setGrams(100);
                onOpenChange(false);
              }}
            >
              记录到今日
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

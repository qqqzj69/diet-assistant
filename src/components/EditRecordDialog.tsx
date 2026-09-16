import { useState } from 'react';
import { Minus, Plus, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IRecordItem, MealType } from '@/data/types';
import { MEAL_OPTIONS } from '@/data/types';
import { foodById } from '@/data/foods';
import { nutrientsFor, nutrientsOfRecord } from '@/lib/nutrition';

interface EditRecordDialogProps {
  open: boolean;
  item: IRecordItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (itemId: string, grams: number, meal: MealType) => void;
}

/** 修改一条记录的分量与餐次 */
export default function EditRecordDialog({
  open,
  item,
  onOpenChange,
  onSave,
}: EditRecordDialogProps) {
  const [grams, setGrams] = useState<number>(item?.grams ?? 100);
  const [meal, setMeal] = useState<MealType>(item?.meal ?? '早餐');

  const food = item ? foodById(item.foodId) : undefined;
  // 预览营养：优先用记录快照（自定义/AI 食物也能算），缺失时按食物库兜底
  const n = item
    ? nutrientsOfRecord({ ...item, grams })
    : food
      ? nutrientsFor(food, grams)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>修改记录</DialogTitle>
          <DialogDescription>
            {item?.foodName}
            {food ? ` · ${food.kcal} 千卡/100g` : n ? ` · 约 ${n.kcal} 千卡/100g` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>食用量（克）</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setGrams((g) => Math.max(10, g - 25))}
                aria-label="减少 25 克"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                min={10}
                max={2000}
                value={grams}
                onChange={(e) => setGrams(Math.max(10, Number(e.target.value) || 10))}
                className="h-9 w-full rounded-md border bg-transparent px-3 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="食用量克数"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setGrams((g) => Math.min(2000, g + 25))}
                aria-label="增加 25 克"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              快速调整：每次 ±25g，也可直接输入
            </p>
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

          {n && (
            <p className="text-xs text-muted-foreground">
              调整后约 <span className="font-semibold text-foreground">{n.kcal} 千卡</span>
              （蛋白 {n.protein}g · 脂肪 {n.fat}g · 碳水 {n.carbs}g）
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              if (item) onSave(item.id, grams, meal);
              onOpenChange(false);
            }}
          >
            <Save className="mr-1.5 h-4 w-4" />
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
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
import type { FoodCategory, MealType } from '@/data/types';
import { FOOD_CATEGORY_OPTIONS } from '@/data/types';
import type { AiFood } from '@/lib/assistant';

export interface AiFoodRecordInput extends AiFood {
  category: FoodCategory;
  grams: number;
  meal: MealType;
}

interface AddAiFoodDialogProps {
  open: boolean;
  food: AiFood | null;
  onOpenChange: (open: boolean) => void;
  /** 记入今日饮食记录 */
  onConfirmRecord: (input: AiFoodRecordInput) => void;
  /** 仅存入食物库（自定义食物） */
  onConfirmLibrary: (input: AiFoodRecordInput) => void;
}

/** 按当前时间推荐餐次 */
function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '早餐';
  if (h >= 11 && h < 14) return '午餐';
  if (h >= 14 && h < 17) return '加餐';
  if (h >= 17 && h < 21) return '晚餐';
  return '加餐';
}

/** 智能助手推荐食物的一键添加：营养数据已按回答填好，只需确认克数与餐次 */
export default function AddAiFoodDialog({
  open,
  food,
  onOpenChange,
  onConfirmRecord,
  onConfirmLibrary,
}: AddAiFoodDialogProps) {
  // 组件由父级用 key={food.name} 重挂载，挂载时即按 AI 回答预填
  const [name, setName] = useState(food?.name ?? '');
  const [category, setCategory] = useState<FoodCategory>('主食');
  const [kcal, setKcal] = useState(food?.kcal ?? 0);
  const [protein, setProtein] = useState(food?.protein ?? 0);
  const [fat, setFat] = useState(food?.fat ?? 0);
  const [carbs, setCarbs] = useState(food?.carbs ?? 0);
  // 成品食物直接按整份重量记录（如 1 个汉堡 200g），散装食材默认 100g
  const [grams, setGrams] = useState(food?.weight ?? 100);
  const [meal, setMeal] = useState<MealType>(defaultMeal);

  const close = () => onOpenChange(false);
  const valid = name.trim().length > 0 && kcal >= 0 && grams > 0;
  // 营养数据是整份的：本次记录热量 = 整份热量 × 食用量 ÷ 整份重量
  const portionKcal = Math.round((kcal * grams) / Math.max(1, food?.weight ?? 100));

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加：{food?.name ?? ''}</DialogTitle>
          <DialogDescription>
            已按智能助手的回答填好整份营养数据（如 1 个汉堡），确认食用量和餐次后一键记录；也可仅存入食物库备用
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="aif-name">食物名称</Label>
            <Input
              id="aif-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="aif-kcal">热量（千卡/份）</Label>
              <Input
                id="aif-kcal"
                type="number"
                min={0}
                value={kcal}
                onChange={(e) => setKcal(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aif-grams">食用量（克）</Label>
              <Input
                id="aif-grams"
                type="number"
                min={1}
                value={grams}
                onChange={(e) => setGrams(Math.max(1, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aif-protein">蛋白质（g/份）</Label>
              <Input
                id="aif-protein"
                type="number"
                min={0}
                value={protein}
                onChange={(e) => setProtein(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aif-fat">脂肪（g/份）</Label>
              <Input
                id="aif-fat"
                type="number"
                min={0}
                value={fat}
                onChange={(e) => setFat(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aif-carbs">碳水（g/份）</Label>
              <Input
                id="aif-carbs"
                type="number"
                min={0}
                value={carbs}
                onChange={(e) => setCarbs(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>分类</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FoodCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>餐次</Label>
            <Select value={meal} onValueChange={(v) => setMeal(v as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['早餐', '午餐', '晚餐', '加餐'] as MealType[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            本次记录：{grams}g ≈ <span className="font-semibold text-foreground">{portionKcal} 千卡</span>（{meal}）
            {food && food.weight !== 100 && ` · 整份约 ${food.weight}g`}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={close}>
            取消
          </Button>
          <Button
            variant="outline"
            disabled={!valid}
            onClick={() => {
              onConfirmLibrary({
                name: name.trim(),
                category,
                kcal,
                protein,
                fat,
                carbs,
                weight: food?.weight ?? 100,
                grams,
                meal,
              });
              close();
            }}
          >
            存入食物库
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirmRecord({
                name: name.trim(),
                category,
                kcal,
                protein,
                fat,
                carbs,
                weight: food?.weight ?? 100,
                grams,
                meal,
              });
              close();
            }}
          >
            添加到记录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

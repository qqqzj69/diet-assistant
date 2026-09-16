import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import RatingStars from './RatingStars';
import { FOODS } from '@/data/foods';
import type { IFood, MealType } from '@/data/types';
import { MEAL_OPTIONS } from '@/data/types';
import { nutrientsFor } from '@/lib/nutrition';

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (food: IFood, grams: number, meal: MealType) => void;
  /** 打开时默认选中的餐次 */
  defaultMeal?: MealType;
}

/** 搜索食物并添加到某餐次；添加后保持打开，可连续记录 */
export default function AddFoodDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultMeal = '早餐',
}: AddFoodDialogProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<IFood | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<MealType>(defaultMeal);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS.slice(0, 30);
    return FOODS.filter(
      (x) => x.name.includes(q) || x.category.includes(q)
    ).slice(0, 30);
  }, [query]);

  const close = () => {
    setQuery('');
    setSelected(null);
    setGrams(100);
    onOpenChange(false);
  };

  const n = selected ? nutrientsFor(selected, grams) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加食物</DialogTitle>
          <DialogDescription>搜索食物库，设置食用量和餐次后记录</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索食物名称，如：鸡胸肉、苹果、米饭"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            autoFocus
          />
        </div>

        {!selected ? (
          <ScrollArea className="h-64 rounded-xl border">
            <div className="divide-y">
              {results.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSelected(food)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.kcal} 千卡/100g · {food.category}
                    </p>
                  </div>
                  <RatingStars rating={food.rating} />
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  没有找到「{query}」，换个关键词试试
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.kcal} 千卡/100g · {selected.category}
                </p>
              </div>
              <Badge variant="outline">已选择</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-grams">食用量（克）</Label>
                <Input
                  id="add-grams"
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
            {n && (
              <p className="mt-2 text-xs text-muted-foreground">
                本份约 <span className="font-semibold text-foreground">{n.kcal} 千卡</span>
                （蛋白 {n.protein}g · 脂肪 {n.fat}g · 碳水 {n.carbs}g）
              </p>
            )}
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => {
                setSelected(null);
                setQuery('');
              }}
            >
              换一个食物
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            取消
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm(selected, grams, meal);
                // 添加成功后重置选择，保持弹窗打开以便继续记录
                setSelected(null);
                setQuery('');
                setGrams(100);
              }
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            添加记录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

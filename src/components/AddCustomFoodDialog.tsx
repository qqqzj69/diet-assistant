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
import type { FoodCategory } from '@/data/types';
import { FOOD_CATEGORY_OPTIONS } from '@/data/types';
import type { CustomFoodInput } from '@/hooks/use-custom-foods';

interface AddCustomFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: CustomFoodInput) => void;
}

/** 录入自定义食物：名称、分类与每 100g 的营养数据 */
export default function AddCustomFoodDialog({
  open,
  onOpenChange,
  onConfirm,
}: AddCustomFoodDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('主食');
  const [kcal, setKcal] = useState(100);
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const [carbs, setCarbs] = useState(0);

  const close = () => {
    setName('');
    setKcal(100);
    setProtein(0);
    setFat(0);
    setCarbs(0);
    onOpenChange(false);
  };

  const valid = name.trim().length > 0 && kcal >= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>自定义食物</DialogTitle>
          <DialogDescription>录入包装标注或估算的营养数据（每 100 克），会置顶显示在食物库</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-name">食物名称</Label>
            <Input
              id="cf-name"
              placeholder="如：自家卤牛肉、某品牌蛋白棒"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-kcal">热量（千卡/100g）</Label>
              <Input
                id="cf-kcal"
                type="number"
                min={0}
                max={2000}
                value={kcal}
                onChange={(e) => setKcal(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-protein">蛋白质（g/100g）</Label>
              <Input
                id="cf-protein"
                type="number"
                min={0}
                max={200}
                value={protein}
                onChange={(e) => setProtein(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-fat">脂肪（g/100g）</Label>
              <Input
                id="cf-fat"
                type="number"
                min={0}
                max={200}
                value={fat}
                onChange={(e) => setFat(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-carbs">碳水化合物（g/100g）</Label>
              <Input
                id="cf-carbs"
                type="number"
                min={0}
                max={200}
                value={carbs}
                onChange={(e) => setCarbs(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            取消
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm({ name, category, kcal, protein, fat, carbs });
              close();
            }}
          >
            保存到食物库
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

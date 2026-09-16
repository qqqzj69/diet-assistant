import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RatingStars from '@/components/RatingStars';
import FoodDetailDialog from '@/components/FoodDetailDialog';
import AddCustomFoodDialog from '@/components/AddCustomFoodDialog';
import { FOODS, CATEGORY_META } from '@/data/foods';
import type { FoodCategory, IFood, MealType } from '@/data/types';
import { FOOD_CATEGORY_OPTIONS } from '@/data/types';
import { useRecords } from '@/hooks/use-records';
import { useCustomFoods } from '@/hooks/use-custom-foods';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const CATEGORY_STYLE: Record<FoodCategory, string> = {
  主食: 'bg-[#D9A441]/15 text-[#8A6A1E]',
  肉蛋: 'bg-[#C97064]/15 text-[#8A4438]',
  水产: 'bg-[#4A7FB5]/15 text-[#2F5685]',
  蔬菜: 'bg-[#2F8F5C]/15 text-[#1F6B43]',
  水果: 'bg-[#E8892D]/15 text-[#A85F14]',
  豆奶: 'bg-[#7B6CB0]/15 text-[#51438A]',
  坚果: 'bg-[#B08C5A]/15 text-[#7A5F33]',
  零食饮料: 'bg-[#D9534F]/15 text-[#A03A36]',
};

let seq = 0;
const genId = () => {
  seq += 1;
  return `${Date.now()}-${seq}`;
};

export default function FoodsPage() {
  const { addItem, records } = useRecords();
  const { customFoods, addCustomFood } = useCustomFoods();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | '全部'>('全部');
  const [selected, setSelected] = useState<IFood | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  /** 统计每个食物被记录过的次数，用于把常用食物排在前面 */
  const recordCounts = useMemo(() => {
    const m = new Map<string, number>();
    records.forEach((r) =>
      r.items.forEach((i) => m.set(i.foodId, (m.get(i.foodId) ?? 0) + 1))
    );
    return m;
  }, [records]);

  const allFoods = useMemo(() => {
    const sortedBuiltin = [...FOODS].sort(
      (a, b) => (recordCounts.get(b.id) ?? 0) - (recordCounts.get(a.id) ?? 0)
    );
    return [...customFoods, ...sortedBuiltin];
  }, [customFoods, recordCounts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((x) => {
      const hitCategory = category === '全部' || x.category === category;
      const hitQuery = !q || x.name.toLowerCase().includes(q);
      return hitCategory && hitQuery;
    });
  }, [query, category, allFoods]);

  const handleAdd = (food: IFood, grams: number, meal: MealType) => {
    addItem(TODAY, {
      id: genId(),
      foodId: food.id,
      foodName: food.name,
      grams,
      meal,
      kcal100: food.kcal,
      protein100: food.protein,
      fat100: food.fat,
      carbs100: food.carbs,
    });
    toast.success(`已记录：${food.name} ${grams}g（${meal}）`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">食物库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            内置 {FOODS.length} 种常见食物 + {customFoods.length} 个自定义，查看热量、营养和减脂优缺点
          </p>
        </div>
        <Button onClick={() => setCustomOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          自定义食物
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜索食物，如：鸡胸肉、苹果、奶茶"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          key="all"
          type="button"
          size="sm"
          variant={category === '全部' ? 'default' : 'outline'}
          onClick={() => setCategory('全部')}
        >
          全部
        </Button>
        {FOOD_CATEGORY_OPTIONS.map((c) => (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={category === c ? 'default' : 'outline'}
            onClick={() => setCategory(c)}
          >
            {c}
            <span className="ml-1 hidden text-xs opacity-70 sm:inline">
              {CATEGORY_META[c].desc}
            </span>
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((food) => (
          <Card
            key={food.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setSelected(food)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{food.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {food.kcal} 千卡/100g
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {food.id.startsWith('custom-') && (
                    <Badge variant="secondary">自定义</Badge>
                  )}
                  <Badge className={CATEGORY_STYLE[food.category]} variant="outline">
                    {food.category}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <RatingStars rating={food.rating} />
                <span className="text-xs text-muted-foreground">
                  蛋白 {food.protein}g · 脂 {food.fat}g · 碳 {food.carbs}g
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {query || category !== '全部'
            ? `没有找到「${query || category}」，换个关键词试试，或点右上角自定义添加`
            : '食物库还没有内容，点右上角「自定义食物」添加'}
        </p>
      )}

      <FoodDetailDialog
        food={selected}
        open={selected !== null}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
        onAdd={(grams, meal) => {
          if (selected) handleAdd(selected, grams, meal);
        }}
      />

      <AddCustomFoodDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onConfirm={(input) => {
          addCustomFood(input);
          toast.success(`已添加自定义食物：${input.name}`);
        }}
      />
    </div>
  );
}

import { useState } from 'react';
import type { FoodCategory, IFood } from '@/data/types';
import { store } from '@/lib/store';

export interface CustomFoodInput {
  name: string;
  category: FoodCategory;
  /** 每 100 克热量（千卡） */
  kcal: number;
  /** 每 100 克蛋白质（克） */
  protein: number;
  /** 每 100 克脂肪（克） */
  fat: number;
  /** 每 100 克碳水化合物（克） */
  carbs: number;
}

/** 自定义食物：存 localStorage，加入食物库并置顶展示 */
export function useCustomFoods() {
  const [customFoods, setCustomFoods] = useState<IFood[]>(() =>
    store.get<IFood[]>('custom-foods', [])
  );

  const persist = (next: IFood[]) => {
    setCustomFoods(next);
    store.set('custom-foods', next);
  };

  const addCustomFood = (input: CustomFoodInput) => {
    const item: IFood = {
      id: `custom-${Date.now()}`,
      name: input.name.trim(),
      category: input.category,
      kcal: input.kcal,
      protein: input.protein,
      fat: input.fat,
      carbs: input.carbs,
      fiber: 0,
      rating: 3,
      pros: ['自定义食物', '按你录入的数据计算'],
      cons: ['数据以包装标注或估算为准'],
      advice: '减脂期优先选天然食材，包装食品以营养成分表为准',
    };
    persist([item, ...customFoods]);
  };

  const removeCustomFood = (id: string) => {
    persist(customFoods.filter((f) => f.id !== id));
  };

  return { customFoods, addCustomFood, removeCustomFood };
}

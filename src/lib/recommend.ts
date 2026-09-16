// EXPORTS: recommendFoods, mealPlanSuggestion, IRecommendation, IMealSuggestion
// 个性化推荐：基于剩余热量、蛋白缺口、纤维缺口从内置食物库评分筛选；
// 三餐建议为数据驱动的示例配比，按目标热量自动调整主食份量。

import { FOODS } from '@/data/foods';
import type { IFood } from '@/data/types';

export interface IRecommendation {
  food: IFood;
  reason: string;
}

export interface IMealSuggestion {
  meal: string;
  items: { name: string; grams: number }[];
  kcal: number;
}

export interface IRecommendOpts {
  remainingKcal: number;
  proteinDeficit: number;
  fiberDeficit: number;
}

const reasonFor = (f: IFood, opts: IRecommendOpts): string => {
  if (opts.proteinDeficit > 3 && f.protein >= 15) return `高蛋白 · 每100g含${f.protein}g`;
  if (opts.fiberDeficit > 3 && f.fiber >= 3) return `高纤维 · 每100g含${f.fiber}g`;
  if (f.kcal <= 80) return '低热量 · 放心吃';
  if (f.rating === 5) return '减脂友好度 5 星';
  return `每100g ${f.kcal} 千卡 · 均衡之选`;
};

/** 按当前缺口推荐食物（最多 6 个），评分向高蛋白、高纤维、低热量密度倾斜 */
export function recommendFoods(opts: IRecommendOpts): IRecommendation[] {
  const budget = Math.max(200, opts.remainingKcal);
  const scored = FOODS.filter((f) => f.rating >= 3)
    .map((f) => {
      let score = 0;
      if (opts.proteinDeficit > 0) score += f.protein * 2;
      if (opts.fiberDeficit > 0) score += f.fiber * 2;
      // 高热量密度重罚（每超 300 千卡/100g 扣分），避免坚果油脂类霸榜
      if (f.kcal > 300) score -= (f.kcal - 300) * 0.1;
      // 超过剩余预算七成再扣分
      if (f.kcal > budget * 0.7) score -= 1.5;
      return { f, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 6).map(({ f }) => ({ food: f, reason: reasonFor(f, opts) }));
}

const foodByName = (name: string): IFood | undefined => FOODS.find((x) => x.name === name);

const kcalOf = (items: { name: string; grams: number }[]): number => {
  let kcal = 0;
  for (const it of items) {
    const f = foodByName(it.name);
    if (f) kcal += (f.kcal * it.grams) / 100;
  }
  return Math.round(kcal);
};

const proteinOf = (items: { name: string; grams: number }[]): number => {
  let p = 0;
  for (const it of items) {
    const f = foodByName(it.name);
    if (f) p += (f.protein * it.grams) / 100;
  }
  return Math.round(p);
};

/**
 * 生成一日三餐示例配比：以"米饭"为主食调节项，让总热量贴近目标。
 */
export function mealPlanSuggestion(target: number): IMealSuggestion[] {
  const meals: { meal: string; items: { name: string; grams: number }[] }[] = [
    { meal: '早餐', items: [{ name: '燕麦片（干）', grams: 40 }, { name: '鸡蛋（煮）', grams: 50 }, { name: '牛奶（全脂）', grams: 200 }] },
    { meal: '午餐', items: [{ name: '米饭（蒸）', grams: 150 }, { name: '鸡胸肉', grams: 100 }, { name: '西兰花', grams: 200 }] },
    { meal: '晚餐', items: [{ name: '红薯', grams: 150 }, { name: '基围虾', grams: 100 }, { name: '生菜', grams: 150 }] },
    { meal: '加餐', items: [{ name: '苹果', grams: 200 }] },
  ];

  // 除午餐米饭外的固定热量
  const fixed = meals
    .map((m) => (m.meal === '午餐' ? m.items.filter((i) => i.name !== '米饭（蒸）') : m.items))
    .reduce((acc, items) => acc + kcalOf(items), 0);

  const rice = foodByName('米饭（蒸）');
  let riceGrams = 150;
  if (rice) {
    const needed = (target - fixed) / (rice.kcal / 100);
    riceGrams = Math.max(75, Math.min(350, Math.round(needed / 25) * 25));
  }

  return meals.map((m) => {
    const items =
      m.meal === '午餐'
        ? [...m.items.filter((i) => i.name !== '米饭（蒸）'), { name: '米饭（蒸）', grams: riceGrams }]
        : m.items;
    return { meal: m.meal, items, kcal: kcalOf(items) };
  });
}

export { proteinOf };

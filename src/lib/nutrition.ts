// EXPORTS: nutrientsFor, round1, calcBmr, calcTdee, calcCalorieTarget, calcMacroTargets, ACTIVITY_FACTOR, GOAL_ADJUST, sumRecordItems
// 营养计算：热量与三大营养素按每 100 克数据换算；BMR 用 Mifflin-St Jeor 公式。

import type { IFood, IProfile, IRecordItem } from '@/data/types';
import { foodById } from '@/data/foods';

export interface INutrients {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** 按克数换算某食物的热量与营养 */
export const nutrientsFor = (food: IFood, grams: number): INutrients => {
  const f = grams / 100;
  return {
    kcal: Math.round(food.kcal * f),
    protein: round1(food.protein * f),
    fat: round1(food.fat * f),
    carbs: round1(food.carbs * f),
    fiber: round1(food.fiber * f),
  };
};

/** 汇总一组饮食记录项的营养 */
export const sumRecordItems = (items: IRecordItem[]): INutrients => {
  const total: INutrients = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  for (const item of items) {
    const food = foodById(item.foodId);
    if (!food) continue;
    const n = nutrientsFor(food, item.grams);
    total.kcal += n.kcal;
    total.protein += n.protein;
    total.fat += n.fat;
    total.carbs += n.carbs;
    total.fiber += n.fiber;
  }
  total.kcal = Math.round(total.kcal);
  return total;
};

/** Mifflin-St Jeor 基础代谢（千卡/天） */
export const calcBmr = (p: IProfile): number => {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return Math.round(p.gender === 'male' ? base + 5 : base - 161);
};

export const ACTIVITY_FACTOR: Record<IProfile['activity'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

/** 每日总消耗 TDEE */
export const calcTdee = (p: IProfile): number => Math.round(calcBmr(p) * ACTIVITY_FACTOR[p.activity]);

/** 目标热量调整（千卡/天） */
export const GOAL_ADJUST: Record<IProfile['goal'], number> = {
  lose05: -500,
  lose1: -1000,
  maintain: 0,
  gain: 300,
};

/** 每日热量摄入目标，女性不低于 1200、男性不低于 1500 */
export const calcCalorieTarget = (p: IProfile): number => {
  const target = calcTdee(p) + GOAL_ADJUST[p.goal];
  const floor = p.gender === 'female' ? 1200 : 1500;
  return Math.max(floor, target);
};

/** 三大营养素目标（克/天）：蛋白按体重系数，脂肪占 25% 热量，其余为碳水 */
export const calcMacroTargets = (p: IProfile, calorieTarget: number) => {
  const proteinPerKg = p.goal === 'gain' ? 1.6 : p.goal === 'maintain' ? 1.2 : 1.5;
  const protein = Math.round(p.weight * proteinPerKg);
  const fat = Math.round((calorieTarget * 0.25) / 9);
  const carbs = Math.round((calorieTarget - protein * 4 - fat * 9) / 4);
  return { protein, fat, carbs };
};

export interface IPlanResult {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  protein: number;
  fat: number;
  carbs: number;
  /** 每日热量缺口（正数=在制造缺口） */
  deficit: number;
}

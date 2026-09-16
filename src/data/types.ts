// EXPORTS: FoodCategory, IFood, IProfile, IRecordItem, IRecordDay, IExercise, MEAL_OPTIONS, FOOD_CATEGORY_OPTIONS, ACTIVITY_OPTIONS, GOAL_OPTIONS

export type FoodCategory =
  | '主食'
  | '肉蛋'
  | '水产'
  | '蔬菜'
  | '水果'
  | '豆奶'
  | '坚果'
  | '零食饮料';

export const FOOD_CATEGORY_OPTIONS: FoodCategory[] = [
  '主食',
  '肉蛋',
  '水产',
  '蔬菜',
  '水果',
  '豆奶',
  '坚果',
  '零食饮料',
];

export interface IFood {
  id: string;
  name: string;
  category: FoodCategory;
  /** 每 100 克可食部的热量（千卡） */
  kcal: number;
  /** 每 100 克蛋白质（克） */
  protein: number;
  /** 每 100 克脂肪（克） */
  fat: number;
  /** 每 100 克碳水化合物（克） */
  carbs: number;
  /** 每 100 克膳食纤维（克） */
  fiber: number;
  /** 减脂视角推荐度 1-5 */
  rating: number;
  pros: string[];
  cons: string[];
  advice: string;
}

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: '久坐', desc: '几乎不运动，办公室久坐' },
  { value: 'light', label: '轻度活动', desc: '每周运动 1-3 次' },
  { value: 'moderate', label: '中度活动', desc: '每周运动 3-5 次' },
  { value: 'active', label: '高度活动', desc: '每周运动 6-7 次' },
  { value: 'very', label: '极高活动', desc: '体力工作或每天高强度训练' },
];

export type Goal = 'lose05' | 'lose1' | 'maintain' | 'gain';

export const GOAL_OPTIONS: { value: Goal; label: string; desc: string }[] = [
  { value: 'lose05', label: '温和减脂', desc: '每周约减 0.5 kg，日缺口约 500 千卡' },
  { value: 'lose1', label: '快速减脂', desc: '每周约减 1 kg，日缺口约 1000 千卡' },
  { value: 'maintain', label: '维持体重', desc: '摄入与消耗基本持平' },
  { value: 'gain', label: '增肌增重', desc: '每日少量热量盈余' },
];

export interface IProfile {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  activity: ActivityLevel;
  goal: Goal;
}

export type MealType = '早餐' | '午餐' | '晚餐' | '加餐';

export const MEAL_OPTIONS: MealType[] = ['早餐', '午餐', '晚餐', '加餐'];

export interface IRecordItem {
  id: string;
  foodId: string;
  foodName: string;
  /** 食用克数 */
  grams: number;
  meal: MealType;
}

export interface IRecordDay {
  /** 形如 2026-09-15 */
  date: string;
  items: IRecordItem[];
}

export interface IExercise {
  id: string;
  name: string;
  /** MET 代谢当量（每公斤体重每小时消耗的千卡系数） */
  met: number;
  category: '有氧' | '力量' | '球类' | '舒缓' | '高强度';
}

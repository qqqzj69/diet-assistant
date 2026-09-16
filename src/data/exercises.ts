// EXPORTS: EXERCISES
// 数据说明：MET（代谢当量）参考《体力活动汇编 Compendium of Physical Activities》常见取值。
// 消耗公式：千卡 = MET × 体重(kg) × 时长(小时)。

import type { IExercise } from './types';

export const EXERCISES: IExercise[] = [
  { id: 'e1', name: '散步（4km/h）', met: 3.0, category: '舒缓' },
  { id: 'e2', name: '快走（6km/h）', met: 4.3, category: '有氧' },
  { id: 'e3', name: '慢跑（8km/h）', met: 8.3, category: '有氧' },
  { id: 'e4', name: '跑步（10km/h）', met: 9.8, category: '有氧' },
  { id: 'e5', name: '跳绳（中等强度）', met: 11.0, category: '高强度' },
  { id: 'e6', name: '游泳（自由泳）', met: 8.0, category: '有氧' },
  { id: 'e7', name: '骑行（休闲 16km/h）', met: 4.0, category: '有氧' },
  { id: 'e8', name: '骑行（竞速 20km/h+）', met: 7.5, category: '有氧' },
  { id: 'e9', name: '瑜伽', met: 2.5, category: '舒缓' },
  { id: 'e10', name: '力量训练（举铁）', met: 5.0, category: '力量' },
  { id: 'e11', name: 'HIIT 高强度间歇', met: 8.5, category: '高强度' },
  { id: 'e12', name: '羽毛球', met: 5.5, category: '球类' },
  { id: 'e13', name: '篮球', met: 6.5, category: '球类' },
  { id: 'e14', name: '足球', met: 7.0, category: '球类' },
  { id: 'e15', name: '爬楼梯', met: 8.0, category: '高强度' },
  { id: 'e16', name: '椭圆机', met: 5.0, category: '有氧' },
  { id: 'e17', name: '跳舞', met: 4.5, category: '有氧' },
  { id: 'e18', name: '平板支撑', met: 3.5, category: '力量' },
  { id: 'e19', name: '拉伸', met: 2.3, category: '舒缓' },
];

export const exerciseById = (id: string): IExercise | undefined =>
  EXERCISES.find((x) => x.id === id);

/** 计算运动消耗（千卡） */
export const calcExerciseKcal = (met: number, weightKg: number, minutes: number): number =>
  Math.round(met * weightKg * (minutes / 60));

/** 反向：消耗给定热量所需分钟数（向上取整到 1 分钟） */
export const minutesToBurn = (met: number, weightKg: number, kcal: number): number =>
  Math.max(1, Math.ceil(kcal / (met * weightKg * (1 / 60))));

import { useState } from 'react';
import type { Gender } from '@/data/types';
import { store } from '@/lib/store';

/** 首页小人的性别形象：首次使用选择后存入 localStorage，可随时切换 */
export function useMascot() {
  const [gender, setGenderState] = useState<Gender | null>(() =>
    store.get<Gender | null>('mascot-gender', null)
  );

  const setGender = (g: Gender) => {
    setGenderState(g);
    store.set('mascot-gender', g);
  };

  return { gender, setGender };
}

import { useState } from 'react';
import type { IProfile } from '@/data/types';
import { store } from '@/lib/store';

/** 个人档案：从 localStorage 读取，保存后写回 */
export function useProfile() {
  const [profile, setProfileState] = useState<IProfile | null>(() =>
    store.get<IProfile | null>('profile', null)
  );

  const saveProfile = (p: IProfile) => {
    setProfileState(p);
    store.set('profile', p);
  };

  return { profile, saveProfile };
}

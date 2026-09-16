import { useState } from 'react';
import type { IRecordDay, IRecordItem } from '@/data/types';
import { store } from '@/lib/store';

/** 饮食记录：按日期分组，存 localStorage */
export function useRecords() {
  const [records, setRecords] = useState<IRecordDay[]>(() =>
    store.get<IRecordDay[]>('records', [])
  );

  const persist = (next: IRecordDay[]) => {
    setRecords(next);
    store.set('records', next);
  };

  const dayRecords = (date: string): IRecordDay | undefined =>
    records.find((r) => r.date === date);

  const addItem = (date: string, item: IRecordItem) => {
    const existing = dayRecords(date);
    if (existing) {
      persist(
        records.map((r) => (r.date === date ? { ...r, items: [...r.items, item] } : r))
      );
    } else {
      persist([...records, { date, items: [item] }]);
    }
  };

  const removeItem = (date: string, itemId: string) => {
    persist(
      records
        .map((r) =>
          r.date === date ? { ...r, items: r.items.filter((i) => i.id !== itemId) } : r
        )
        .filter((r) => r.items.length > 0)
    );
  };

  /** 修改某条记录的份量或餐次 */
  const updateItem = (
    date: string,
    itemId: string,
    patch: Partial<Pick<IRecordItem, 'grams' | 'meal'>>
  ) => {
    persist(
      records.map((r) =>
        r.date === date
          ? { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : r
      )
    );
  };

  return { records, addItem, removeItem, updateItem, dayRecords };
}

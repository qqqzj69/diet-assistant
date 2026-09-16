// 带项目命名空间的 localStorage 封装，读写均容错（隐私模式静默降级）
const NS = 'diet-assistant';

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${NS}:${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
    } catch {
      /* 隐私模式 / 存储被禁用时静默降级 */
    }
  },
};

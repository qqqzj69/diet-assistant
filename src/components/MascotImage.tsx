import type { Gender } from '@/data/types';
import maleNormal from '@/assets/male-normal.png';
import maleFull from '@/assets/male-full.png';
import maleHungry from '@/assets/male-hungry.png';
import maleEnergetic from '@/assets/male-energetic.png';
import femaleNormal from '@/assets/female-normal.png';
import femaleFull from '@/assets/female-full.png';
import femaleHungry from '@/assets/female-hungry.png';
import femaleEnergetic from '@/assets/female-energetic.png';

export type MascotState = 'normal' | 'full' | 'hungry' | 'energetic';

const STATE_IMAGES: Record<Gender, Record<MascotState, string>> = {
  male: { normal: maleNormal, full: maleFull, hungry: maleHungry, energetic: maleEnergetic },
  female: { normal: femaleNormal, full: femaleFull, hungry: femaleHungry, energetic: femaleEnergetic },
};

interface MascotImageProps {
  gender: Gender;
  /** 饱腹度 = 已摄入 / 目标，0~∞，控制状态表情与轻微缩放 */
  fullness: number;
  /** 当前小时 0-23，深夜切换为安静的普通表情 */
  hour: number;
  className?: string;
}

/**
 * 主页形象小人：根据性别选择对应的 3D 角色素材，
 * 按饱腹度切换表情（吃超→饱腹、很饿→饥饿、深夜→安静、正常→活力），
 * 并保留轻微缩放与淡入动效。
 */
export default function MascotImage({ gender, fullness, hour, className }: MascotImageProps) {
  const over = fullness > 1.05;
  const hungry = fullness < 0.35;
  const sleepy = hour >= 23 || hour < 6;
  const state: MascotState = over ? 'full' : hungry ? 'hungry' : sleepy ? 'normal' : 'energetic';
  const scale = over ? 1.03 : hungry ? 0.97 : 1;
  const src = STATE_IMAGES[gender][state];

  return (
    <img
      key={`${gender}-${state}`}
      src={src}
      alt={gender === 'male' ? '男生减脂小伙伴' : '女生减脂小伙伴'}
      draggable={false}
      className={className}
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.5s ease',
        animation: 'mascot-in 0.4s ease both',
      }}
    />
  );
}

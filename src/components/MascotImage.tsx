import mascotUrl from '@/assets/mascot.png';

interface MascotImageProps {
  /** 饱腹度 = 已摄入 / 目标，0~∞，控制体型缩放 */
  fullness: number;
  /** 当前小时 0-23，夜间降低亮度表现困倦 */
  hour: number;
  className?: string;
}

/**
 * 主页形象小人：使用用户提供的奶龙风素材图。
 * 静态形象无法像手绘 SVG 那样改表情，改用整体动效表达状态：
 * 吃超时微微胀大、饥饿时略微缩小、深夜变暗表示困倦。
 */
export default function MascotImage({ fullness, hour, className }: MascotImageProps) {
  const over = fullness > 1.05;
  const hungry = fullness < 0.35;
  const sleepy = hour >= 23 || hour < 6;
  const scale = over ? 1.06 : hungry ? 0.96 : 1;

  return (
    <img
      src={mascotUrl}
      alt="奶龙风减脂小人"
      draggable={false}
      className={className}
      style={{
        transform: `scale(${scale})`,
        filter: sleepy ? 'brightness(0.88) saturate(0.85)' : undefined,
        transition: 'transform 0.5s ease, filter 0.5s ease',
      }}
    />
  );
}

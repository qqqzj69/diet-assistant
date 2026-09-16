interface NutritionProgressProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}

/** 单项营养达标进度条 */
export default function NutritionProgress({
  label,
  value,
  target,
  unit,
  color,
}: NutritionProgressProps) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target > 0 && value > target;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={over ? 'text-destructive' : 'text-muted-foreground'}>
          {Math.round(value)} / {target} {unit}
          {over ? ' · 已超标' : ''}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

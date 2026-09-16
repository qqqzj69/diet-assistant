import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  className?: string;
}

/** 1-5 星推荐度展示 */
export default function RatingStars({ rating, className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/40'
          )}
        />
      ))}
    </div>
  );
}

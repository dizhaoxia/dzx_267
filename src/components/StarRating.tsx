import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StarRating({
  rating,
  count,
  className,
  size = 14,
}: {
  rating: number
  count: number
  className?: string
  size?: number
}) {
  if (!count) {
    return <span className={cn('text-xs text-gray-400', className)}>暂无评分</span>
  }
  const rounded = Math.round(rating)
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={
              i <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
            }
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-amber-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

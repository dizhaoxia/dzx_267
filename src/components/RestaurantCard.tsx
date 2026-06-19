import { Link } from 'react-router-dom'
import { MapPin, Utensils } from 'lucide-react'
import type { Restaurant } from '@/lib/types'
import StarRating from './StarRating'

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const r = restaurant
  const tags = r.tags?.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3) ?? []

  return (
    <Link
      to={`/restaurants/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100">
        {r.coverThumb || r.coverImage ? (
          <img
            src={r.coverThumb || r.coverImage || ''}
            alt={r.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-orange-200">
            <Utensils className="h-12 w-12" />
          </div>
        )}
        {r.status === 'offline' && (
          <span className="absolute left-2 top-2 rounded-md bg-gray-900/70 px-2 py-0.5 text-xs text-white">
            已下架
          </span>
        )}
        {r.category && (
          <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-orange-600 backdrop-blur">
            {r.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-gray-800 group-hover:text-orange-600">
            {r.name}
          </h3>
        </div>

        <StarRating rating={Number(r.avgRating)} count={r.ratingCount} />

        <div className="flex items-start gap-1 text-xs text-gray-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{r.address}</span>
        </div>

        {tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {tags.map((t, i) => (
              <span
                key={i}
                className="rounded bg-orange-50 px-1.5 py-0.5 text-xs text-orange-600"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

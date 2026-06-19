import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Tag,
  Navigation,
  Utensils,
} from 'lucide-react'
import api from '@/lib/api'
import type { Restaurant } from '@/lib/types'
import StarRating from '@/components/StarRating'
import Spinner from '@/components/Spinner'

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .get<{ data: Restaurant }>(`/restaurants/${id}`)
      .then((res) => setRestaurant(res.data.data))
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner label="加载餐厅详情…" />
  if (error)
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-500">
        {error}
      </div>
    )
  if (!restaurant) return null

  const r = restaurant
  const tags = r.tags?.split(',').map((t) => t.trim()).filter(Boolean) ?? []
  const cover = r.coverImage || r.coverThumb
  const hasCoords = r.longitude != null && r.latitude != null
  const mapUrl = hasCoords
    ? `https://uri.amap.com/marker?position=${r.longitude},${r.latitude}&name=${encodeURIComponent(r.name)}`
    : null

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> 返回列表
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative aspect-[16/7] w-full bg-gradient-to-br from-orange-50 to-amber-100">
          {cover ? (
            <img src={cover} alt={r.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-orange-200">
              <Utensils className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{r.name}</h1>
              {r.category && (
                <span className="mt-1 inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                  {r.category.name}
                </span>
              )}
            </div>
            <StarRating rating={Number(r.avgRating)} count={r.ratingCount} size={18} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="地址" value={r.address} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="电话" value={r.phone || '未提供'} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="营业时间" value={r.businessHours || '未提供'} />
            {r.merchant && (
              <InfoRow icon={<Utensils className="h-4 w-4" />} label="发布商家" value={r.merchant.name} />
            )}
          </div>

          {hasCoords && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Navigation className="h-4 w-4 text-orange-500" />
              <span>
                坐标：{Number(r.longitude).toFixed(4)}, {Number(r.latitude).toFixed(4)}
              </span>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="font-medium text-orange-600 hover:underline">
                  查看地图 →
                </a>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4 text-orange-500" /> 特色标签
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-600">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {r.description && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium text-gray-700">餐厅简介</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {r.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-gray-700">{value}</div>
      </div>
    </div>
  )
}

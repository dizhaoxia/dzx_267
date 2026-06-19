import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Tag,
  Navigation,
  Utensils,
  Heart,
  MapPinned,
  MessageSquare,
  Loader2,
  Star,
} from 'lucide-react'
import type {
  Restaurant,
  Checkin,
  Review,
  Paginated,
} from '@/lib/types'
import { parsePhotoArray } from '@/lib/types'
import {
  getRestaurant,
  getRestaurantCheckins,
  getRestaurantReviews,
  createCheckin,
  createReview,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from '@/lib/api'
import StarRating from '@/components/StarRating'
import Spinner from '@/components/Spinner'
import PhotoPicker, { type PickedPhoto } from '@/components/PhotoPicker'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorited, setFavorited] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getRestaurant(id)
      .then((data) => setRestaurant(data))
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user || !id) return
    checkFavorite(Number(id))
      .then((res) => setFavorited(res.isFavorited))
      .catch(() => {})
  }, [user, id])

  const toggleFavorite = async () => {
    if (!user || !restaurant) return
    setFavBusy(true)
    try {
      if (favorited) {
        await removeFavorite(restaurant.id)
        setFavorited(false)
      } else {
        await addFavorite(restaurant.id)
        setFavorited(true)
      }
    } catch {
      /* toast handled globally */
    } finally {
      setFavBusy(false)
    }
  }

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
            <div className="flex items-center gap-3">
              <StarRating rating={Number(r.avgRating)} count={r.ratingCount} size={18} />
              {user && (
                <button
                  onClick={toggleFavorite}
                  disabled={favBusy}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                    favorited
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-gray-200 text-gray-600 hover:border-rose-200 hover:text-rose-500',
                  )}
                >
                  <Heart className={cn('h-4 w-4', favorited && 'fill-rose-500')} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
              )}
            </div>
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

      {user && hasCoords && (
        <div className="mt-6">
          <CheckinSection restaurantId={r.id} onCheckinSuccess={load} />
        </div>
      )}

      {user && (
        <div className="mt-6">
          <ReviewFormSection restaurantId={r.id} onReviewSuccess={load} />
        </div>
      )}

      <div className="mt-6">
        <CheckinList restaurantId={r.id} />
      </div>

      <div className="mt-6">
        <ReviewList restaurantId={r.id} />
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

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('当前浏览器不支持定位功能')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? '未授权获取位置，请在浏览器设置中允许定位'
            : '获取定位失败，请重试',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return { coords, locating, geoError, locate }
}

function CheckinSection({
  restaurantId,
  onCheckinSuccess,
}: {
  restaurantId: number
  onCheckinSuccess: () => void
}) {
  const { coords, locating, geoError, locate } = useGeolocation()
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!coords) {
      setErr('请先获取当前位置')
      return
    }
    setSubmitting(true)
    setErr(null)
    setMsg(null)
    try {
      await createCheckin({
        restaurantId,
        latitude: coords.lat,
        longitude: coords.lng,
        photos: photos.map((p) => p.file),
      })
      setMsg('打卡成功！')
      setPhotos([])
      onCheckinSuccess()
    } catch (e) {
      setErr(e instanceof Error ? e.message : '打卡失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
        <MapPinned className="h-5 w-5 text-orange-500" />
        到店打卡
        <span className="text-xs font-normal text-gray-400">需在餐厅 100 米内</span>
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-600 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {coords ? '重新定位' : '获取当前位置'}
        </button>
        {coords && (
          <span className="text-xs text-gray-500">
            经度 {coords.lng.toFixed(5)}，纬度 {coords.lat.toFixed(5)}
          </span>
        )}
      </div>
      {geoError && <p className="mt-2 text-xs text-red-500">{geoError}</p>}

      <div className="mt-4">
        <PhotoPicker max={3} onChange={setPhotos} onError={setErr} />
      </div>

      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!coords || submitting}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
        提交打卡
      </button>
    </div>
  )
}

function ReviewFormSection({
  restaurantId,
  onReviewSuccess,
}: {
  restaurantId: number
  onReviewSuccess: () => void
}) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setErr(null)
    setMsg(null)
    try {
      await createReview({
        restaurantId,
        rating,
        content: content.trim() || undefined,
        photos: photos.map((p) => p.file),
      })
      setMsg('评论发布成功！')
      setContent('')
      setPhotos([])
      setRating(5)
      onReviewSuccess()
    } catch (e) {
      setErr(e instanceof Error ? e.message : '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
        <MessageSquare className="h-5 w-5 text-orange-500" />
        评分与评论
      </h3>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                (hover || rating) >= i ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-amber-600">{hover || rating} 星</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="说说你的用餐体验（可选）"
        className="mt-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />

      <div className="mt-3">
        <PhotoPicker max={2} onChange={setPhotos} onError={setErr} />
      </div>

      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        发布评论
      </button>
    </div>
  )
}

function CheckinList({ restaurantId }: { restaurantId: number }) {
  const [data, setData] = useState<Paginated<Checkin> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getRestaurantCheckins(restaurantId, page, 5)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [restaurantId, page])

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
        <MapPinned className="h-5 w-5 text-orange-500" />
        打卡记录
        {data && <span className="text-xs font-normal text-gray-400">（共 {data.total} 条）</span>}
      </h3>

      <div className="mt-4">
        {loading ? (
          <Spinner label="加载打卡记录…" />
        ) : data && data.list.length > 0 ? (
          <ul className="space-y-3">
            {data.list.map((c) => {
              const thumbs = parsePhotoArray(c.photoThumbs)
              const photos = parsePhotoArray(c.photos)
              return (
                <li key={c.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {c.user?.name ?? '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    距离餐厅 {Number(c.distance).toFixed(0)} 米
                  </p>
                  {thumbs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(thumbs.length ? thumbs : photos).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`打卡图 ${i + 1}`}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">还没有人打卡，快来成为第一个吧～</p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pager page={page} totalPages={data.totalPages} onChange={setPage} />
      )}
    </div>
  )
}

function ReviewList({ restaurantId }: { restaurantId: number }) {
  const [data, setData] = useState<Paginated<Review> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getRestaurantReviews(restaurantId, page, 5)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [restaurantId, page])

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
        <MessageSquare className="h-5 w-5 text-orange-500" />
        用户评论
        {data && <span className="text-xs font-normal text-gray-400">（共 {data.total} 条）</span>}
      </h3>

      <div className="mt-4">
        {loading ? (
          <Spinner label="加载评论…" />
        ) : data && data.list.length > 0 ? (
          <ul className="space-y-4">
            {data.list.map((rv) => {
              const thumbs = parsePhotoArray(rv.photoThumbs)
              const photos = parsePhotoArray(rv.photos)
              return (
                <li key={rv.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {rv.user?.name ?? '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(rv.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="mt-1">
                    <StarRating rating={rv.rating} count={1} size={14} />
                  </div>
                  {rv.content && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                      {rv.content}
                    </p>
                  )}
                  {thumbs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(thumbs.length ? thumbs : photos).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`评论图 ${i + 1}`}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">还没有评论，快来发表第一条吧～</p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pager page={page} totalPages={data.totalPages} onChange={setPage} />
      )}
    </div>
  )
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 disabled:opacity-40"
      >
        上一页
      </button>
      <span className="text-gray-500">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 disabled:opacity-40"
      >
        下一页
      </button>
    </div>
  )
}

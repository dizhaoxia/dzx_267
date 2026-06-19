import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User as UserIcon,
  MapPinned,
  MessageSquare,
  Heart,
  Utensils,
} from 'lucide-react'
import type {
  Paginated,
  Checkin,
  Review,
  Favorite,
} from '@/lib/types'
import { parsePhotoArray } from '@/lib/types'
import {
  getMyCheckins,
  getMyReviews,
  getMyFavorites,
  removeFavorite,
} from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/Spinner'
import StarRating from '@/components/StarRating'
import RestaurantCard from '@/components/RestaurantCard'
import { cn } from '@/lib/utils'

type Tab = 'checkins' | 'reviews' | 'favorites'

const PAGE_SIZE = 6

export default function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('checkins')

  const [checkins, setCheckins] = useState<Paginated<Checkin> | null>(null)
  const [reviews, setReviews] = useState<Paginated<Review> | null>(null)
  const [favorites, setFavorites] = useState<Paginated<Favorite> | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchTab = useCallback(() => {
    setLoading(true)
    const req =
      tab === 'checkins'
        ? getMyCheckins(page, PAGE_SIZE)
        : tab === 'reviews'
          ? getMyReviews(page, PAGE_SIZE)
          : getMyFavorites(page, PAGE_SIZE)
    req
      .then((data) => {
        if (tab === 'checkins') setCheckins(data as Paginated<Checkin>)
        else if (tab === 'reviews') setReviews(data as Paginated<Review>)
        else setFavorites(data as Paginated<Favorite>)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab, page])

  useEffect(() => {
    fetchTab()
  }, [fetchTab])

  const switchTab = (t: Tab) => {
    setTab(t)
    setPage(1)
  }

  const handleUnfavorite = async (restaurantId: number) => {
    try {
      await removeFavorite(restaurantId)
      fetchTab()
    } catch {
      /* ignore */
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
        <p>请先登录后查看个人中心</p>
        <Link to="/login" className="btn-primary">
          去登录
        </Link>
      </div>
    )
  }

  const current =
    tab === 'checkins' ? checkins : tab === 'reviews' ? reviews : favorites

  return (
    <div>
      {/* User header */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="mt-1 text-sm text-orange-50">
                {user.email || user.phone || '欢迎来到食光探店'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-2 border-b border-gray-100">
        <TabBtn active={tab === 'checkins'} onClick={() => switchTab('checkins')} icon={<MapPinned className="h-4 w-4" />}>
          我的打卡
        </TabBtn>
        <TabBtn active={tab === 'reviews'} onClick={() => switchTab('reviews')} icon={<MessageSquare className="h-4 w-4" />}>
          我的评论
        </TabBtn>
        <TabBtn active={tab === 'favorites'} onClick={() => switchTab('favorites')} icon={<Heart className="h-4 w-4" />}>
          我的收藏
        </TabBtn>
      </div>

      <div className="mt-5">
        {loading ? (
          <Spinner label="加载中…" />
        ) : tab === 'checkins' ? (
          <CheckinTab data={checkins} />
        ) : tab === 'reviews' ? (
          <ReviewTab data={reviews} />
        ) : (
          <FavoriteTab data={favorites} onUnfavorite={handleUnfavorite} />
        )}
      </div>

      {current && current.totalPages > 1 && (
        <Pager page={page} totalPages={current.totalPages} onChange={setPage} />
      )}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-orange-500',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function CheckinTab({ data }: { data: Paginated<Checkin> | null }) {
  if (!data || data.list.length === 0) {
    return <EmptyHint text="还没有打卡记录，去探店打卡吧～" />
  }
  return (
    <ul className="space-y-3">
      {data.list.map((c) => {
        const thumbs = parsePhotoArray(c.photoThumbs)
        const photos = parsePhotoArray(c.photos)
        return (
          <li key={c.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Link
                to={`/restaurants/${c.restaurantId}`}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:text-orange-600"
              >
                <Utensils className="h-4 w-4 text-orange-400" />
                {c.restaurant?.name ?? '餐厅'}
              </Link>
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
  )
}

function ReviewTab({ data }: { data: Paginated<Review> | null }) {
  if (!data || data.list.length === 0) {
    return <EmptyHint text="还没有评论，去给餐厅打分吧～" />
  }
  return (
    <ul className="space-y-3">
      {data.list.map((rv) => {
        const thumbs = parsePhotoArray(rv.photoThumbs)
        const photos = parsePhotoArray(rv.photos)
        return (
          <li key={rv.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Link
                to={`/restaurants/${rv.restaurantId}`}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:text-orange-600"
              >
                <Utensils className="h-4 w-4 text-orange-400" />
                {rv.restaurant?.name ?? '餐厅'}
              </Link>
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
  )
}

function FavoriteTab({
  data,
  onUnfavorite,
}: {
  data: Paginated<Favorite> | null
  onUnfavorite: (restaurantId: number) => void
}) {
  if (!data || data.list.length === 0) {
    return <EmptyHint text="还没有收藏餐厅，去发现心仪的店吧～" />
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.list.map((fav) => {
        const r = fav.restaurant
        if (!r) return null
        return (
          <div key={fav.id} className="relative">
            <RestaurantCard restaurant={r} />
            <button
              type="button"
              onClick={() => onUnfavorite(r.id)}
              title="取消收藏"
              className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-rose-500"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-16 text-gray-400">
      <Heart className="h-10 w-10" />
      <p className="text-sm">{text}</p>
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
    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, EyeOff, Eye, Store } from 'lucide-react'
import api from '@/lib/api'
import type { Restaurant, RestaurantStatus } from '@/lib/types'
import Spinner from '@/components/Spinner'
import { cn } from '@/lib/utils'

export default function MerchantDashboard() {
  const [list, setList] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const fetchList = () => {
    setLoading(true)
    api
      .get<{ data: Restaurant[] }>('/restaurants/mine')
      .then((res) => setList(res.data.data))
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchList, [])

  const toggleStatus = async (r: Restaurant) => {
    const next: RestaurantStatus = r.status === 'published' ? 'offline' : 'published'
    setBusyId(r.id)
    try {
      await api.patch(`/restaurants/${r.id}/status`, { status: next })
      setList((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)))
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (r: Restaurant) => {
    if (!confirm(`确认删除「${r.name}」？该操作不可恢复。`)) return
    setBusyId(r.id)
    try {
      await api.delete(`/restaurants/${r.id}`)
      setList((prev) => prev.filter((x) => x.id !== r.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Store className="h-5 w-5 text-orange-500" /> 我的餐厅
        </h1>
        <Link to="/merchant/new" className="btn-primary">
          <Plus className="h-4 w-4" /> 发布新餐厅
        </Link>
      </div>

      {loading ? (
        <Spinner label="加载中…" />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-500">
          {error}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-16 text-gray-400">
          <Store className="h-10 w-10" />
          <p>你还没有发布任何餐厅</p>
          <Link to="/merchant/new" className="btn-primary">
            <Plus className="h-4 w-4" /> 发布第一家餐厅
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">餐厅</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">评分</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {r.coverThumb && (
                          <img src={r.coverThumb} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link to={`/restaurants/${r.id}`} className="line-clamp-1 font-medium text-gray-800 hover:text-orange-600">
                          {r.name}
                        </Link>
                        <div className="line-clamp-1 text-xs text-gray-400">{r.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.category?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.ratingCount ? `${Number(r.avgRating).toFixed(1)} (${r.ratingCount})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title={r.status === 'published' ? '下架' : '上架'}
                        disabled={busyId === r.id}
                        onClick={() => toggleStatus(r)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {r.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        to={`/merchant/edit/${r.id}`}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        title="删除"
                        disabled={busyId === r.id}
                        onClick={() => remove(r)}
                        className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: RestaurantStatus }) {
  return (
    <span
      className={cn(
        'badge',
        status === 'published'
          ? 'bg-green-50 text-green-600'
          : 'bg-gray-100 text-gray-500',
      )}
    >
      {status === 'published' ? '已上架' : '已下架'}
    </span>
  )
}

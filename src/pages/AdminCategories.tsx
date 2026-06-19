import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Tags } from 'lucide-react'
import api from '@/lib/api'
import type { Category } from '@/lib/types'
import Spinner from '@/components/Spinner'

export default function AdminCategories() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchList = () => {
    setLoading(true)
    api
      .get<{ data: Category[] }>('/categories')
      .then((res) => setList(res.data.data))
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchList, [])

  const add = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.post<{ data: Category }>('/categories', { name: newName.trim() })
      setList((prev) => [...prev, res.data.data])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setEditingName(c.name)
  }

  const saveEdit = async (id: number) => {
    if (!editingName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.put<{ data: Category }>(`/categories/${id}`, { name: editingName.trim() })
      setList((prev) => prev.map((c) => (c.id === id ? res.data.data : c)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: Category) => {
    if (!confirm(`确认删除分类「${c.name}」？`)) return
    setBusy(true)
    setError(null)
    try {
      await api.delete(`/categories/${c.id}`)
      setList((prev) => prev.filter((x) => x.id !== c.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-800">
        <Tags className="h-5 w-5 text-orange-500" /> 餐厅分类管理
      </h1>

      <div className="mb-5 flex gap-2">
        <input
          className="form-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="新增分类，如：东南亚菜"
        />
        <button onClick={add} disabled={busy} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> 添加
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
      )}

      {loading ? (
        <Spinner label="加载中…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ul className="divide-y divide-gray-50">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                {editingId === c.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      className="form-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                    <button onClick={() => saveEdit(c.id)} disabled={busy} className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100" title="保存">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-50 p-2 text-gray-500 hover:bg-gray-100" title="取消">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-xs font-medium text-orange-600">
                        {c.name.slice(0, 1)}
                      </span>
                      <span className="font-medium text-gray-700">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(c)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50" title="编辑">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c)} disabled={busy} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50" title="删除">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-gray-400">暂无分类</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

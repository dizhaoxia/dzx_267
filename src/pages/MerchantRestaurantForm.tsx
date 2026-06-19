import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '@/lib/api'
import type { Category, Restaurant, RestaurantStatus } from '@/lib/types'
import ImageUpload from '@/components/ImageUpload'
import Spinner from '@/components/Spinner'

interface FormState {
  name: string
  categoryId: string
  address: string
  longitude: string
  latitude: string
  phone: string
  businessHours: string
  tags: string
  description: string
  status: RestaurantStatus
  coverImage: string | null
  coverThumb: string | null
}

const EMPTY: FormState = {
  name: '',
  categoryId: '',
  address: '',
  longitude: '',
  latitude: '',
  phone: '',
  businessHours: '',
  tags: '',
  description: '',
  status: 'published',
  coverImage: null,
  coverThumb: null,
}

export default function MerchantRestaurantForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories')
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    api
      .get<{ data: Restaurant }>(`/restaurants/${id}`)
      .then((res) => {
        const r = res.data.data
        setForm({
          name: r.name,
          categoryId: String(r.categoryId),
          address: r.address,
          longitude: r.longitude != null ? String(r.longitude) : '',
          latitude: r.latitude != null ? String(r.latitude) : '',
          phone: r.phone ?? '',
          businessHours: r.businessHours ?? '',
          tags: r.tags ?? '',
          description: r.description ?? '',
          status: r.status,
          coverImage: r.coverImage,
          coverThumb: r.coverThumb,
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) return setError('请填写餐厅名称')
    if (!form.address.trim()) return setError('请填写餐厅地址')
    if (!form.categoryId) return setError('请选择餐厅分类')

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      address: form.address.trim(),
      categoryId: Number(form.categoryId),
      longitude: form.longitude.trim() === '' ? null : Number(form.longitude),
      latitude: form.latitude.trim() === '' ? null : Number(form.latitude),
      phone: form.phone.trim() || null,
      businessHours: form.businessHours.trim() || null,
      tags: form.tags.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      coverImage: form.coverImage,
      coverThumb: form.coverThumb,
    }

    setSubmitting(true)
    try {
      if (isEdit && id) {
        await api.put(`/restaurants/${id}`, payload)
      } else {
        await api.post('/restaurants', payload)
      }
      navigate('/merchant')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="加载餐厅信息…" />

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/merchant')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回商家后台
      </button>

      <h1 className="mb-5 text-xl font-bold text-gray-800">
        {isEdit ? '编辑餐厅' : '发布新餐厅'}
      </h1>

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="餐厅名称" required>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="如：老北京烤鸭店" />
          </Field>
          <Field label="餐厅分类" required>
            <select className="form-select" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">请选择分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="地址" required>
          <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="详细地址，如：北京市朝阳区工体北路 1 号" />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="经度">
            <input className="form-input" type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="如：116.4345" />
          </Field>
          <Field label="纬度">
            <input className="form-input" type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="如：39.9308" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="联系电话">
            <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="如：010-12345678" />
          </Field>
          <Field label="营业时间">
            <input className="form-input" value={form.businessHours} onChange={(e) => set('businessHours', e.target.value)} placeholder="如：10:00-22:00" />
          </Field>
        </div>

        <Field label="特色标签" hint="多个标签用英文逗号分隔">
          <input className="form-input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="如：烤鸭,京菜,聚餐" />
        </Field>

        <Field label="简介">
          <textarea className="form-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="介绍餐厅特色、招牌菜等" />
        </Field>

        <Field label="上架状态">
          <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value as RestaurantStatus)}>
            <option value="published">上架（公开可见）</option>
            <option value="offline">下架（仅自己可见）</option>
          </select>
        </Field>

        <Field label="封面图">
          <ImageUpload
            coverImage={form.coverImage}
            coverThumb={form.coverThumb}
            onChange={(urls) => setForm((prev) => ({ ...prev, ...urls }))}
          />
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate('/merchant')}>
            取消
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            <Save className="h-4 w-4" />
            {submitting ? '保存中…' : '保存餐厅'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400">*</span>}
        {hint && <span className="text-xs font-normal text-gray-400">（{hint}）</span>}
      </span>
      {children}
    </label>
  )
}

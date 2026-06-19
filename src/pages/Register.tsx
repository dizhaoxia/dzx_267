import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Store } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('请填写昵称')
    if (!phone.trim() && !email.trim()) return setError('手机号和邮箱至少填写一项')
    if (password.length < 6) return setError('密码至少 6 位')
    if (password !== confirm) return setError('两次输入的密码不一致')

    setSubmitting(true)
    try {
      await register({
        name: name.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-800">注册账号</h1>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <RoleCard
            active={role === 'user'}
            onClick={() => setRole('user')}
            icon={<User className="h-5 w-5" />}
            title="普通用户"
            desc="浏览探店餐厅"
          />
          <RoleCard
            active={role === 'merchant'}
            onClick={() => setRole('merchant')}
            icon={<Store className="h-5 w-5" />}
            title="商家"
            desc="发布管理餐厅"
          />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="昵称">
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="给自己起个名字" required />
          </Field>
          <Field label="手机号">
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号（选填，与邮箱二选一）" />
          </Field>
          <Field label="邮箱">
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱（选填，与手机号二选一）" />
          </Field>
          <Field label="密码">
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" />
          </Field>
          <Field label="确认密码">
            <input className="form-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次输入密码" />
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-2">
            {submitting ? '注册中…' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          已有账号？{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  )
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-colors',
        active ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 hover:border-gray-300',
      )}
    >
      {icon}
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs">{desc}</span>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, LogOut, Store, Tags, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = {
  user: '食客',
  merchant: '商家',
  admin: '管理员',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 text-orange-600">
          <UtensilsCrossed className="h-6 w-6" />
          <span className="text-lg font-bold">食光探店</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavItem to="/">首页</NavItem>

          {user && (
            <NavItem to="/profile" icon={<UserCircle className="h-4 w-4" />}>
              我的
            </NavItem>
          )}

          {user && (user.role === 'merchant' || user.role === 'admin') && (
            <NavItem to="/merchant" icon={<Store className="h-4 w-4" />}>
              商家后台
            </NavItem>
          )}
          {user && user.role === 'admin' && (
            <NavItem to="/admin/categories" icon={<Tags className="h-4 w-4" />}>
              分类管理
            </NavItem>
          )}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-600"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                注册
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function NavItem({
  to,
  children,
  icon,
}: {
  to: string
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          isActive ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600',
        )
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  )
}

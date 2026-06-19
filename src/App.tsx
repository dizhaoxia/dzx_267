import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import RestaurantDetail from '@/pages/RestaurantDetail'
import MerchantDashboard from '@/pages/MerchantDashboard'
import MerchantRestaurantForm from '@/pages/MerchantRestaurantForm'
import AdminCategories from '@/pages/AdminCategories'
import Profile from '@/pages/Profile'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-white py-5 text-center text-xs text-gray-400">
        食光探店 · React + Vite + Express + MySQL 全文检索 demo
      </footer>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
      <p className="text-5xl font-bold">404</p>
      <p>页面走丢了</p>
      <Link to="/" className="btn-primary">
        回到首页
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant"
              element={
                <ProtectedRoute roles={['merchant', 'admin']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant/new"
              element={
                <ProtectedRoute roles={['merchant', 'admin']}>
                  <MerchantRestaurantForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant/edit/:id"
              element={
                <ProtectedRoute roles={['merchant', 'admin']}>
                  <MerchantRestaurantForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

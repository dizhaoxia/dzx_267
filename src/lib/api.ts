import axios, { AxiosError } from 'axios'
import type { ApiEnvelope } from './types'

/**
 * Axios instance for the backend. In dev, Vite proxies `/api` and `/uploads`
 * to the Express server on port 32211.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.error || error.message || '网络请求失败，请稍后重试'
    if (status === 401) {
      // Stale token — drop it so the UI treats the user as logged-out.
      localStorage.removeItem('token')
    }
    return Promise.reject(new Error(message))
  },
)

export default api

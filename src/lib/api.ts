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
    const data = error.response?.data
    let message = '网络请求失败，请稍后重试'

    if (data?.error && typeof data.error === 'string') {
      message = data.error
    } else if (error.code === 'ERR_NETWORK') {
      message = '网络连接失败，请检查网络后重试'
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else if (status === 401) {
      message = data?.error || '登录已过期，请重新登录'
    } else if (status === 403) {
      message = data?.error || '无权访问该资源'
    } else if (status === 404) {
      message = data?.error || '请求的资源不存在'
    } else if (status && status >= 500) {
      message = data?.error || '服务器繁忙，请稍后重试'
    } else if (error.message) {
      message = error.message
    }

    if (status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(new Error(message))
  },
)

export default api

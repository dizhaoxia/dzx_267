import axios, { AxiosError } from 'axios'
import type {
  ApiEnvelope,
  Paginated,
  Restaurant,
  RestaurantQuery,
  PublicUser,
  Checkin,
  Review,
  Favorite,
  CheckinCreatePayload,
  ReviewCreatePayload,
} from './types'

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

export async function getRestaurants(params?: RestaurantQuery) {
  const res = await api.get<ApiEnvelope<Paginated<Restaurant>>>('/restaurants', { params })
  return res.data.data
}

export async function getRestaurant(id: number | string) {
  const res = await api.get<ApiEnvelope<Restaurant>>(`/restaurants/${id}`)
  return res.data.data
}

export async function getCurrentUser() {
  const res = await api.get<ApiEnvelope<PublicUser>>('/users/me')
  return res.data.data
}

export async function getUserById(userId: number) {
  const res = await api.get<ApiEnvelope<PublicUser>>(`/users/${userId}`)
  return res.data.data
}

export async function createCheckin(payload: CheckinCreatePayload) {
  const form = new FormData()
  form.append('restaurantId', String(payload.restaurantId))
  form.append('latitude', String(payload.latitude))
  form.append('longitude', String(payload.longitude))
  if (payload.photos) {
    for (const f of payload.photos) {
      form.append('photos', f)
    }
  }
  const res = await api.post<ApiEnvelope<Checkin>>('/checkins', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function getRestaurantCheckins(restaurantId: number, page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Checkin>>>(`/checkins/restaurant/${restaurantId}`, {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function getMyCheckins(page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Checkin>>>('/users/me/checkins', {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function getUserCheckins(userId: number, page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Checkin>>>(`/users/${userId}/checkins`, {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function createReview(payload: ReviewCreatePayload) {
  const form = new FormData()
  form.append('restaurantId', String(payload.restaurantId))
  form.append('rating', String(payload.rating))
  if (payload.content) {
    form.append('content', payload.content)
  }
  if (payload.photos) {
    for (const f of payload.photos) {
      form.append('photos', f)
    }
  }
  const res = await api.post<ApiEnvelope<Review>>('/reviews', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function getRestaurantReviews(restaurantId: number, page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Review>>>(`/reviews/restaurant/${restaurantId}`, {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function getMyReviews(page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Review>>>('/users/me/reviews', {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function getUserReviews(userId: number, page = 1, pageSize = 10) {
  const res = await api.get<ApiEnvelope<Paginated<Review>>>(`/users/${userId}/reviews`, {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function addFavorite(restaurantId: number) {
  const res = await api.post<ApiEnvelope<Favorite>>('/favorites', { restaurantId })
  return res.data.data
}

export async function removeFavorite(restaurantId: number) {
  const res = await api.delete<ApiEnvelope<{ restaurantId: number }>>(`/favorites/${restaurantId}`)
  return res.data.data
}

export async function getMyFavorites(page = 1, pageSize = 12) {
  const res = await api.get<ApiEnvelope<Paginated<Favorite>>>('/favorites/mine', {
    params: { page, pageSize },
  })
  return res.data.data
}

export async function checkFavorite(restaurantId: number) {
  const res = await api.get<ApiEnvelope<{ isFavorited: boolean }>>(`/favorites/check/${restaurantId}`)
  return res.data.data
}

export async function uploadCover(file: File) {
  const form = new FormData()
  form.append('cover', file)
  const res = await api.post<ApiEnvelope<{ coverImage: string; coverThumb: string }>>(
    '/uploads/cover',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return res.data.data
}

export default api

export type UserRole = 'user' | 'merchant' | 'admin'

export interface PublicUser {
  id: number
  phone: string | null
  email: string | null
  name: string
  role: UserRole
  createdAt?: string
}

export interface Category {
  id: number
  name: string
  icon?: string | null
}

export type RestaurantStatus = 'published' | 'offline'

export interface Restaurant {
  id: number
  merchantId: number
  name: string
  address: string
  categoryId: number
  longitude: number | null
  latitude: number | null
  phone: string | null
  businessHours: string | null
  tags: string | null
  description: string | null
  coverImage: string | null
  coverThumb: string | null
  status: RestaurantStatus
  avgRating: number
  ratingCount: number
  hotScore?: number
  ratingScore?: number
  createdAt: string
  updatedAt: string
  category?: Pick<Category, 'id' | 'name'>
  merchant?: { id: number; name: string }
}

export interface RestaurantSummary {
  id: number
  name: string
  coverImage: string | null
  coverThumb: string | null
  address: string
}

export interface Checkin {
  id: number
  userId: number
  restaurantId: number
  latitude: number
  longitude: number
  distance: number
  photos: string | null
  photoThumbs: string | null
  createdAt: string
  updatedAt: string
  user?: { id: number; name: string }
  restaurant?: RestaurantSummary
}

export interface Review {
  id: number
  userId: number
  restaurantId: number
  rating: number
  content: string | null
  photos: string | null
  photoThumbs: string | null
  createdAt: string
  updatedAt: string
  user?: { id: number; name: string }
  restaurant?: RestaurantSummary
}

export interface Favorite {
  id: number
  userId: number
  restaurantId: number
  createdAt: string
  restaurant?: Restaurant & { category?: Pick<Category, 'id' | 'name'> }
}

export interface Paginated<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: string
}

export interface RestaurantQuery {
  keyword?: string
  categoryId?: number
  minLat?: number
  maxLat?: number
  minLng?: number
  maxLng?: number
  page?: number
  pageSize?: number
  sort?: 'hot' | 'rating'
}

export interface CheckinCreatePayload {
  restaurantId: number
  latitude: number
  longitude: number
  photos?: File[]
}

export interface ReviewCreatePayload {
  restaurantId: number
  rating: number
  content?: string
  photos?: File[]
}

export function parsePhotoArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as string[]) : []
  } catch {
    return []
  }
}

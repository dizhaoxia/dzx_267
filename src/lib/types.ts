export type UserRole = 'user' | 'merchant' | 'admin'

export interface PublicUser {
  id: number
  phone: string | null
  email: string | null
  name: string
  role: UserRole
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
  createdAt: string
  updatedAt: string
  category?: Pick<Category, 'id' | 'name'>
  merchant?: { id: number; name: string }
}

export interface Paginated<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Shape of every backend JSON envelope: { success, data, error? } */
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
}

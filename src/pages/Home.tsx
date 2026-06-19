import { useCallback, useEffect, useState } from 'react'
import { Search as SearchIcon, Utensils } from 'lucide-react'
import api from '@/lib/api'
import type { Category, Paginated, Restaurant } from '@/lib/types'
import RestaurantCard from '@/components/RestaurantCard'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import Pagination from '@/components/Pagination'
import Spinner from '@/components/Spinner'

const PAGE_SIZE = 12

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<Restaurant> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]))
  }, [])

  const fetchList = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, unknown> = { page, pageSize: PAGE_SIZE }
    if (keyword) params.keyword = keyword
    if (categoryId) params.categoryId = categoryId
    api
      .get<{ data: Paginated<Restaurant> }>('/restaurants', { params })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [keyword, categoryId, page])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = (kw: string) => {
    setKeyword(kw)
    setPage(1)
  }

  const handleCategory = (id: number | null) => {
    setCategoryId(id)
    setPage(1)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16">
        <div className="absolute -right-10 -top-10 opacity-20">
          <Utensils className="h-48 w-48" />
        </div>
        <div className="relative max-w-2xl">
          <h1 className="text-3xl font-bold sm:text-4xl">发现身边的好味道</h1>
          <p className="mt-2 text-orange-50">
            全文检索餐厅名称、地址与特色标签，按菜系与地区精准筛选。
          </p>
          <div className="mt-6">
            <SearchBar initialValue={keyword} onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="mt-6">
        <CategoryFilter
          categories={categories}
          activeId={categoryId}
          onSelect={handleCategory}
        />
      </section>

      {/* Result meta */}
      <div className="mt-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <SearchIcon className="h-5 w-5 text-orange-500" />
          {keyword ? (
            <>
              “{keyword}” 的搜索结果
              {data ? <span className="text-sm font-normal text-gray-400">（共 {data.total} 家）</span> : null}
            </>
          ) : (
            '最新餐厅'
          )}
        </h2>
      </div>

      {/* List */}
      <section className="mt-4">
        {loading ? (
          <Spinner label="正在加载餐厅…" />
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-500">
            {error}
          </div>
        ) : data && data.list.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.list.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-16 text-gray-400">
            <Utensils className="h-10 w-10" />
            <p>暂无符合条件的餐厅</p>
          </div>
        )}

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  )
}

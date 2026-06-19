import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const from = Math.max(1, page - 2)
  const to = Math.min(totalPages, page + 2)
  for (let i = from; i <= to; i++) pages.push(i)

  const btn =
    'h-9 min-w-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center justify-center gap-1.5 py-6">
      <button
        type="button"
        className={cn(btn, 'flex items-center gap-1 border hover:bg-gray-50')}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {from > 1 && (
        <>
          <button className={cn(btn, 'border hover:bg-gray-50')} onClick={() => onChange(1)}>
            1
          </button>
          {from > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={cn(
            btn,
            p === page
              ? 'bg-orange-500 text-white border border-orange-500'
              : 'border hover:bg-gray-50',
          )}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      {to < totalPages && (
        <>
          {to < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button
            className={cn(btn, 'border hover:bg-gray-50')}
            onClick={() => onChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className={cn(btn, 'flex items-center gap-1 border hover:bg-gray-50')}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

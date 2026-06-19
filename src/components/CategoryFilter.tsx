import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

export default function CategoryFilter({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[]
  activeId: number | null
  onSelect: (id: number | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip active={activeId === null} onClick={() => onSelect(null)}>
        全部
      </Chip>
      {categories.map((c) => (
        <Chip key={c.id} active={activeId === c.id} onClick={() => onSelect(c.id)}>
          {c.name}
        </Chip>
      ))}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-orange-500 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600',
      )}
    >
      {children}
    </button>
  )
}

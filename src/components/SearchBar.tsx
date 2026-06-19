import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = '搜索餐厅名称、地址或特色标签…',
  className,
}: {
  initialValue?: string
  onSearch: (keyword: string) => void
  placeholder?: string
  className?: string
}) {
  const [value, setValue] = useState(initialValue)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
        <Search className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-orange-500 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          搜索
        </button>
      </div>
    </form>
  )
}

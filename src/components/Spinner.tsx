import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-16 text-gray-400', className)}>
      <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

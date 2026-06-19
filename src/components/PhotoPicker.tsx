import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PickedPhoto {
  file: File
  preview: string
}

export default function PhotoPicker({
  max = 3,
  onChange,
  onError,
}: {
  max?: number
  onChange: (photos: PickedPhoto[]) => void
  onError?: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [uploading, setUploading] = useState(false)

  const emit = (next: PickedPhoto[]) => {
    setPhotos(next)
    onChange(next)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (incoming.length === 0) {
      onError?.('请选择图片文件')
      return
    }

    const remain = max - photos.length
    if (remain <= 0) {
      onError?.(`最多只能上传 ${max} 张图片`)
      return
    }
    const accepted = incoming.slice(0, remain)
    const oversized = incoming.find((f) => f.size > 10 * 1024 * 1024)
    if (oversized) {
      onError?.('单张图片不能超过 10MB')
      return
    }

    setUploading(true)
    try {
      const next = [...photos]
      for (const f of accepted) {
        next.push({ file: f, preview: URL.createObjectURL(f) })
      }
      emit(next)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (idx: number) => {
    const target = photos[idx]
    if (target) URL.revokeObjectURL(target.preview)
    emit(photos.filter((_, i) => i !== idx))
  }

  const full = photos.length >= max

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div
            key={i}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
          >
            <img src={p.preview} alt={`预览 ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-orange-300 hover:text-orange-500',
              uploading && 'opacity-60',
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[10px]">{photos.length}/{max}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import api from '@/lib/api'

export default function ImageUpload({
  coverImage,
  coverThumb,
  onChange,
}: {
  coverImage: string | null
  coverThumb: string | null
  onChange: (urls: { coverImage: string | null; coverThumb: string | null }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('cover', file)
      const res = await api.post('/uploads/cover', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange({
        coverImage: res.data.data.coverImage,
        coverThumb: res.data.data.coverThumb,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const preview = coverThumb || coverImage

  return (
    <div>
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        {preview ? (
          <>
            <img src={preview} alt="封面预览" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ coverImage: null, coverThumb: null })}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm">
              {uploading ? '上传中…' : '点击上传封面图片'}
            </span>
            <span className="text-xs text-gray-300">支持 jpg / png / webp，最大 10MB</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

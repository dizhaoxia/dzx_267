import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import sharp from 'sharp'
import type { Request } from 'express'
import { UPLOAD_DIRS } from '../config/env'

const ALLOWED = /jpeg|jpg|png|webp/

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIRS.restaurants, { recursive: true })
    cb(null, UPLOAD_DIRS.restaurants)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const base = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
    cb(null, `${base}${ext}`)
  },
})

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (ALLOWED.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('仅支持 jpg/png/webp 图片格式'), false)
  }
}

/** Single file upload for a restaurant cover image (form field: "cover"). */
export const uploadCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('cover')

/**
 * Generate a 480px-wide JPEG thumbnail next to the source image.
 * Returns the public URL path of the thumbnail.
 */
export async function makeThumbnail(srcFilename: string): Promise<string> {
  const ext = path.extname(srcFilename)
  const base = path.basename(srcFilename, ext)
  const srcPath = path.join(UPLOAD_DIRS.restaurants, srcFilename)
  const thumbName = `${base}_thumb.jpg`
  const destPath = path.join(UPLOAD_DIRS.restaurants, thumbName)
  await sharp(srcPath)
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(destPath)
  return `/uploads/restaurants/${thumbName}`
}

/** Convert an on-disk filename to its public URL path. */
export function toPublicUrl(filename: string): string {
  return `/uploads/restaurants/${filename}`
}

/** Remove a cover image and its thumbnail from disk (best effort). */
export function removeCoverFiles(coverUrl: string | null | undefined): void {
  if (!coverUrl) return
  const filename = path.basename(coverUrl)
  const dir = UPLOAD_DIRS.restaurants
  const base = path.basename(filename, path.extname(filename))
  const files = [filename, `${base}_thumb.jpg`]
  for (const f of files) {
    const p = path.join(dir, f)
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
  }
}

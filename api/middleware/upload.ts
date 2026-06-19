import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import sharp from 'sharp'
import type { Request } from 'express'
import { UPLOAD_DIRS, UPLOAD_URL_PREFIX } from '../config/env'

export type UploadCategory = 'restaurants' | 'checkins' | 'reviews'

const ALLOWED = /jpeg|jpg|png|webp/

function createStorage(category: UploadCategory) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(UPLOAD_DIRS[category], { recursive: true })
      cb(null, UPLOAD_DIRS[category])
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      const base = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
      cb(null, `${base}${ext}`)
    },
  })
}

function createFileFilter() {
  return (
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
}

export function createMulter(category: UploadCategory, maxCount: number, fieldName = 'photos') {
  return multer({
    storage: createStorage(category),
    fileFilter: createFileFilter(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }).array(fieldName, maxCount)
}

export const uploadCover = multer({
  storage: createStorage('restaurants'),
  fileFilter: createFileFilter(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('cover')

export async function makeThumbnail(
  srcFilename: string,
  category: UploadCategory = 'restaurants',
  size = 480,
): Promise<string> {
  const ext = path.extname(srcFilename)
  const base = path.basename(srcFilename, ext)
  const srcPath = path.join(UPLOAD_DIRS[category], srcFilename)
  const thumbName = `${base}_thumb.jpg`
  const destPath = path.join(UPLOAD_DIRS[category], thumbName)
  await sharp(srcPath)
    .resize({ width: size, height: size, fit: 'cover', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(destPath)
  return `${UPLOAD_URL_PREFIX[category]}/${thumbName}`
}

export function toPublicUrl(filename: string, category: UploadCategory = 'restaurants'): string {
  return `${UPLOAD_URL_PREFIX[category]}/${filename}`
}

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

export interface ProcessedPhotos {
  urls: string[]
  thumbUrls: string[]
}

export async function processUploadedPhotos(
  files: Express.Multer.File[],
  category: UploadCategory,
  thumbSize = 200,
): Promise<ProcessedPhotos> {
  const urls: string[] = []
  const thumbUrls: string[] = []
  for (const file of files) {
    urls.push(toPublicUrl(file.filename, category))
    const thumb = await makeThumbnail(file.filename, category, thumbSize)
    thumbUrls.push(thumb)
  }
  return { urls, thumbUrls }
}

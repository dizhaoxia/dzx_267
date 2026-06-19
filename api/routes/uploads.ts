/**
 * Image upload: accepts a single cover image, stores it under
 * public/uploads/restaurants/ and synchronously generates a 480px thumbnail.
 */
import { Router, type Request, type Response } from 'express'
import { uploadCover, makeThumbnail, toPublicUrl } from '../middleware/upload.js'
import { asyncHandler, ApiError, success } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/uploads/cover  (merchant / admin)  multipart field: cover
 * -> { coverImage, coverThumb }
 */
router.post(
  '/cover',
  authenticate,
  requireRole('merchant', 'admin'),
  (req: Request, res: Response, next) => {
    uploadCover(req, res, (err) => {
      if (err) {
        next(new ApiError(400, err.message || '图片上传失败'))
        return
      }
      next()
    })
  },
  asyncHandler(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) {
      throw new ApiError(400, '请上传封面图片')
    }
    const coverImage = toPublicUrl(file.filename)
    const coverThumb = await makeThumbnail(file.filename)
    success(res, { coverImage, coverThumb }, 201)
  }),
)

export default router

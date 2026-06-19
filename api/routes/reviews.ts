import { Router, type Request, type Response } from 'express'
import { literal } from 'sequelize'
import { Review, Restaurant, User } from '../models/index.js'
import { asyncHandler, ApiError, success, paginate } from '../utils/http.js'
import { authenticate } from '../middleware/auth.js'
import { createMulter, processUploadedPhotos } from '../middleware/upload.js'

const router = Router()

const uploadReviewPhotos = createMulter('reviews', 2, 'photos')

async function updateRestaurantStats(restaurantId: number) {
  const result = (await Review.findOne({
    where: { restaurantId },
    attributes: [
      [literal('COUNT(*)'), 'count'],
      [literal('AVG(rating)'), 'avg'],
    ],
    raw: true,
  })) as unknown as { count: number; avg: number | null }

  const count = Number(result.count) || 0
  const avg = count > 0 ? Number(result.avg) : 0

  await Restaurant.update(
    { avgRating: Math.round(avg * 10) / 10, ratingCount: count },
    { where: { id: restaurantId } },
  )
}

router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next) => {
    uploadReviewPhotos(req, res, (err) => {
      if (err) {
        next(new ApiError(400, err.message || '图片上传失败'))
        return
      }
      next()
    })
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, rating, content } = req.body
    const files = (req as Request & { files?: Express.Multer.File[] }).files || []

    const rid = Number(restaurantId)
    const r = Number(rating)

    if (!Number.isFinite(rid) || rid <= 0) {
      throw new ApiError(400, '餐厅参数无效')
    }
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw new ApiError(400, '评分必须为 1-5 星')
    }

    const restaurant = await Restaurant.findByPk(rid)
    if (!restaurant) {
      throw new ApiError(404, '餐厅不存在')
    }

    const { urls, thumbUrls } = await processUploadedPhotos(files, 'reviews', 200)

    const review = await Review.create({
      userId: req.user!.userId,
      restaurantId: rid,
      rating: r,
      content: content ? String(content).trim() || null : null,
      photos: urls.length > 0 ? JSON.stringify(urls) : null,
      photoThumbs: thumbUrls.length > 0 ? JSON.stringify(thumbUrls) : null,
    })

    await updateRestaurantStats(rid)

    success(res, review, 201)
  }),
)

router.get(
  '/restaurant/:restaurantId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize
    const restaurantId = Number(req.params.restaurantId)

    const { rows, count } = await Review.findAndCountAll({
      where: { restaurantId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

export default router

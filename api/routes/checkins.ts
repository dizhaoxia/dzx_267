import { Router, type Request, type Response } from 'express'
import { Checkin, Restaurant, User } from '../models/index.js'
import { asyncHandler, ApiError, success, paginate } from '../utils/http.js'
import { authenticate } from '../middleware/auth.js'
import { createMulter, processUploadedPhotos } from '../middleware/upload.js'
import { haversineDistance } from '../utils/geo.js'

const router = Router()

const MAX_CHECKIN_DISTANCE = 100

const uploadCheckinPhotos = createMulter('checkins', 3, 'photos')

router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next) => {
    uploadCheckinPhotos(req, res, (err) => {
      if (err) {
        next(new ApiError(400, err.message || '图片上传失败'))
        return
      }
      next()
    })
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, latitude, longitude } = req.body
    const files = (req as Request & { files?: Express.Multer.File[] }).files || []

    const rid = Number(restaurantId)
    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!Number.isFinite(rid) || rid <= 0) {
      throw new ApiError(400, '餐厅参数无效')
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new ApiError(400, 'GPS 坐标无效')
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiError(400, 'GPS 坐标超出范围')
    }

    const restaurant = await Restaurant.findByPk(rid)
    if (!restaurant) {
      throw new ApiError(404, '餐厅不存在')
    }
    if (restaurant.latitude === null || restaurant.longitude === null) {
      throw new ApiError(400, '餐厅未设置位置信息，无法打卡')
    }

    const distance = haversineDistance(
      lat,
      lng,
      Number(restaurant.latitude),
      Number(restaurant.longitude),
    )

    if (distance > MAX_CHECKIN_DISTANCE) {
      throw new ApiError(
        400,
        `距离餐厅 ${distance.toFixed(0)} 米，需在 ${MAX_CHECKIN_DISTANCE} 米内才能打卡`,
      )
    }

    const { urls, thumbUrls } = await processUploadedPhotos(files, 'checkins', 200)

    const checkin = await Checkin.create({
      userId: req.user!.userId,
      restaurantId: rid,
      latitude: lat,
      longitude: lng,
      distance: Math.round(distance * 100) / 100,
      photos: urls.length > 0 ? JSON.stringify(urls) : null,
      photoThumbs: thumbUrls.length > 0 ? JSON.stringify(thumbUrls) : null,
    })

    success(res, checkin, 201)
  }),
)

router.get(
  '/restaurant/:restaurantId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize
    const restaurantId = Number(req.params.restaurantId)

    const { rows, count } = await Checkin.findAndCountAll({
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

import { Router, type Request, type Response } from 'express'
import { Checkin, Review, User, Restaurant } from '../models/index.js'
import { asyncHandler, ApiError, success, paginate } from '../utils/http.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByPk(req.user!.userId, {
      attributes: ['id', 'phone', 'email', 'name', 'role', 'createdAt'],
    })
    if (!user) {
      throw new ApiError(404, '用户不存在')
    }
    success(res, user)
  }),
)

router.get(
  '/me/checkins',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize

    const { rows, count } = await Checkin.findAndCountAll({
      where: { userId: req.user!.userId },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'coverImage', 'coverThumb', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

router.get(
  '/me/reviews',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize

    const { rows, count } = await Review.findAndCountAll({
      where: { userId: req.user!.userId },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'coverImage', 'coverThumb', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const uid = Number(req.params.userId)
    if (!Number.isFinite(uid) || uid <= 0) {
      throw new ApiError(400, '用户参数无效')
    }

    const user = await User.findByPk(uid, {
      attributes: ['id', 'name', 'role', 'createdAt'],
    })
    if (!user) {
      throw new ApiError(404, '用户不存在')
    }
    success(res, user)
  }),
)

router.get(
  '/:userId/checkins',
  asyncHandler(async (req: Request, res: Response) => {
    const uid = Number(req.params.userId)
    if (!Number.isFinite(uid) || uid <= 0) {
      throw new ApiError(400, '用户参数无效')
    }

    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize

    const { rows, count } = await Checkin.findAndCountAll({
      where: { userId: uid },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'coverImage', 'coverThumb', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

router.get(
  '/:userId/reviews',
  asyncHandler(async (req: Request, res: Response) => {
    const uid = Number(req.params.userId)
    if (!Number.isFinite(uid) || uid <= 0) {
      throw new ApiError(400, '用户参数无效')
    }

    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize

    const { rows, count } = await Review.findAndCountAll({
      where: { userId: uid },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'coverImage', 'coverThumb', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

export default router

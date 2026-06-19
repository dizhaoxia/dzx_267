import { Router, type Request, type Response } from 'express'
import { UniqueConstraintError } from 'sequelize'
import { Favorite, Restaurant, Category } from '../models/index.js'
import { asyncHandler, ApiError, success, paginate } from '../utils/http.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.body
    const rid = Number(restaurantId)

    if (!Number.isFinite(rid) || rid <= 0) {
      throw new ApiError(400, '餐厅参数无效')
    }

    const restaurant = await Restaurant.findByPk(rid)
    if (!restaurant) {
      throw new ApiError(404, '餐厅不存在')
    }

    try {
      const fav = await Favorite.create({
        userId: req.user!.userId,
        restaurantId: rid,
      })
      success(res, fav, 201)
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ApiError(400, '该餐厅已收藏')
      }
      throw err
    }
  }),
)

router.delete(
  '/:restaurantId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rid = Number(req.params.restaurantId)
    if (!Number.isFinite(rid) || rid <= 0) {
      throw new ApiError(400, '餐厅参数无效')
    }

    const deleted = await Favorite.destroy({
      where: { userId: req.user!.userId, restaurantId: rid },
    })

    if (deleted === 0) {
      throw new ApiError(404, '未收藏该餐厅')
    }

    success(res, { restaurantId: rid })
  }),
)

router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 50)
    const offset = (page - 1) * pageSize

    const { rows, count } = await Favorite.findAndCountAll({
      where: { userId: req.user!.userId },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
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
  '/check/:restaurantId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const rid = Number(req.params.restaurantId)
    if (!Number.isFinite(rid) || rid <= 0) {
      throw new ApiError(400, '餐厅参数无效')
    }

    const fav = await Favorite.findOne({
      where: { userId: req.user!.userId, restaurantId: rid },
    })

    success(res, { isFavorited: !!fav })
  }),
)

export default router

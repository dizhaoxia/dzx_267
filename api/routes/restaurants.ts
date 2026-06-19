/**
 * Restaurants: public list/search/detail + merchant CRUD.
 * Full-text search uses MySQL FULLTEXT (ngram) on name/address/tags.
 */
import { Router, type Request, type Response } from 'express'
import { Op, literal, type WhereOptions } from 'sequelize'
import { Restaurant } from '../models/Restaurant.js'
import { Category } from '../models/Category.js'
import { User } from '../models/User.js'
import { sequelize } from '../config/db.js'
import { asyncHandler, ApiError, success, paginate } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { removeCoverFiles } from '../middleware/upload.js'

const router = Router()

const LIST_ATTRIBUTES = { exclude: ['description'] }

function clampPageSize(v: unknown): number {
  const n = Number(v) || 12
  return Math.min(Math.max(n, 1), 50)
}

function toNumberOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * GET /api/restaurants  (public)
 * query: keyword, categoryId, minLat, maxLat, minLng, maxLng, page, pageSize, sort
 *   sort=hot     -> 热度榜：ORDER BY hot_score DESC, rating_score DESC, created_at DESC
 *   sort=rating  -> 好评榜：ORDER BY rating_score DESC, rating_count DESC, created_at DESC
 *   (default)    -> 最新：ORDER BY created_at DESC
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { keyword, categoryId, minLat, maxLat, minLng, maxLng } = req.query
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = clampPageSize(req.query.pageSize)
    const offset = (page - 1) * pageSize

    const sort = String(req.query.sort ?? '').toLowerCase()
    const order: [string, string][] =
      sort === 'hot'
        ? [['hot_score', 'DESC'], ['rating_score', 'DESC'], ['created_at', 'DESC']]
        : sort === 'rating'
          ? [
              ['rating_score', 'DESC'],
              ['rating_count', 'DESC'],
              ['created_at', 'DESC'],
            ]
          : [['created_at', 'DESC']]

    const ands: WhereOptions[] = [{ status: 'published' }]

    const kw = String(keyword ?? '').trim()
    if (kw) {
      // Qualify columns with the Sequelize model alias `Restaurant` to avoid
      // ambiguity with the joined `categories.name` column.
      ands.push(
        literal(
          `MATCH(\`Restaurant\`.\`name\`, \`Restaurant\`.\`address\`, \`Restaurant\`.\`tags\`) AGAINST(${sequelize.escape(kw)} IN BOOLEAN MODE)`,
        ),
      )
    }
    if (categoryId) {
      ands.push({ categoryId: Number(categoryId) })
    }
    const loLat = toNumberOrNull(minLat)
    const hiLat = toNumberOrNull(maxLat)
    const loLng = toNumberOrNull(minLng)
    const hiLng = toNumberOrNull(maxLng)
    if (loLat !== null && hiLat !== null) {
      ands.push({ latitude: { [Op.between]: [loLat, hiLat] } })
    }
    if (loLng !== null && hiLng !== null) {
      ands.push({ longitude: { [Op.between]: [loLng, hiLng] } })
    }
    const where: WhereOptions =
      ands.length === 1 ? ands[0] : ({ [Op.and]: ands } as WhereOptions)

    const { rows, count } = await Restaurant.findAndCountAll({
      where,
      attributes: LIST_ATTRIBUTES,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order,
      limit: pageSize,
      offset,
      distinct: true,
    })

    paginate(res, { list: rows, total: count, page, pageSize })
  }),
)

/**
 * GET /api/restaurants/mine  (merchant/admin) — all statuses of the current merchant.
 */
router.get(
  '/mine',
  authenticate,
  requireRole('merchant', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const list = await Restaurant.findAll({
      where: { merchantId: req.user!.userId },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    })
    success(res, list)
  }),
)

/**
 * GET /api/restaurants/:id  (public) — only published (offline only visible to owner/admin).
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'merchant', attributes: ['id', 'name'] },
      ],
    })
    if (!restaurant) throw new ApiError(404, '餐厅不存在')
    if (restaurant.status === 'offline') {
      const user = req.user
      if (!user || (user.role !== 'admin' && user.userId !== restaurant.merchantId)) {
        throw new ApiError(404, '餐厅不存在')
      }
    }
    success(res, restaurant)
  }),
)

function buildPayload(body: Record<string, unknown>, merchantId: number) {
  const name = String(body.name ?? '').trim()
  const address = String(body.address ?? '').trim()
  const categoryId = Number(body.categoryId)
  if (!name) throw new ApiError(400, '餐厅名称不能为空')
  if (!address) throw new ApiError(400, '餐厅地址不能为空')
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new ApiError(400, '请选择餐厅分类')
  }
  return {
    merchantId,
    name,
    address,
    categoryId,
    longitude: toNumberOrNull(body.longitude),
    latitude: toNumberOrNull(body.latitude),
    phone: body.phone ? String(body.phone).trim() : null,
    businessHours: body.businessHours ? String(body.businessHours).trim() : null,
    tags: body.tags ? String(body.tags).trim() : null,
    description: body.description ? String(body.description).trim() : null,
    coverImage: body.coverImage ? String(body.coverImage).trim() : null,
    coverThumb: body.coverThumb ? String(body.coverThumb).trim() : null,
    status: body.status === 'offline' ? 'offline' : 'published',
  }
}

async function loadOwned(req: Request) {
  const restaurant = await Restaurant.findByPk(req.params.id)
  if (!restaurant) throw new ApiError(404, '餐厅不存在')
  if (req.user!.role !== 'admin' && restaurant.merchantId !== req.user!.userId) {
    throw new ApiError(403, '无权操作该餐厅')
  }
  return restaurant
}

/**
 * POST /api/restaurants  (merchant/admin)
 */
router.post(
  '/',
  authenticate,
  requireRole('merchant', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = buildPayload(req.body ?? {}, req.user!.userId)
    const cat = await Category.findByPk(payload.categoryId)
    if (!cat) throw new ApiError(400, '所选分类不存在')
    const restaurant = await Restaurant.create(payload)
    success(res, restaurant, 201)
  }),
)

/**
 * PUT /api/restaurants/:id  (merchant/admin owner)
 */
router.put(
  '/:id',
  authenticate,
  requireRole('merchant', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await loadOwned(req)
    const payload = buildPayload(req.body ?? {}, restaurant.merchantId)
    const cat = await Category.findByPk(payload.categoryId)
    if (!cat) throw new ApiError(400, '所选分类不存在')

    // If the cover changed, remove the old image files from disk.
    if (
      restaurant.coverImage &&
      payload.coverImage &&
      restaurant.coverImage !== payload.coverImage
    ) {
      removeCoverFiles(restaurant.coverImage)
    }

    restaurant.set(payload)
    await restaurant.save()
    success(res, restaurant)
  }),
)

/**
 * PATCH /api/restaurants/:id/status  (merchant/admin owner) — publish / take offline.
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('merchant', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await loadOwned(req)
    const status = req.body?.status === 'offline' ? 'offline' : 'published'
    restaurant.status = status
    await restaurant.save()
    success(res, restaurant)
  }),
)

/**
 * DELETE /api/restaurants/:id  (merchant/admin owner)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('merchant', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await loadOwned(req)
    removeCoverFiles(restaurant.coverImage)
    await restaurant.destroy()
    success(res, { id: restaurant.id })
  }),
)

export default router

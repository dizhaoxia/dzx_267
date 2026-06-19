/**
 * Restaurant categories: admin-managed CRUD + public list.
 */
import { Router, type Request, type Response } from 'express'
import { Category } from '../models/Category.js'
import { Restaurant } from '../models/Restaurant.js'
import { asyncHandler, ApiError, success } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/categories  (public)
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const list = await Category.findAll({ order: [['id', 'ASC']] })
    success(res, list)
  }),
)

/**
 * POST /api/categories  (admin)
 */
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, icon } = req.body ?? {}
    if (!name || !String(name).trim()) {
      throw new ApiError(400, '分类名称不能为空')
    }
    const exists = await Category.findOne({ where: { name: String(name).trim() } })
    if (exists) {
      throw new ApiError(409, '该分类已存在')
    }
    const cat = await Category.create({
      name: String(name).trim(),
      icon: icon?.trim() || null,
    })
    success(res, cat, 201)
  }),
)

/**
 * PUT /api/categories/:id  (admin)
 */
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const cat = await Category.findByPk(req.params.id)
    if (!cat) throw new ApiError(404, '分类不存在')
    const { name, icon } = req.body ?? {}
    if (name !== undefined) {
      const trimmed = String(name).trim()
      if (!trimmed) throw new ApiError(400, '分类名称不能为空')
      const dup = await Category.findOne({ where: { name: trimmed } })
      if (dup && dup.id !== cat.id) throw new ApiError(409, '该分类已存在')
      cat.name = trimmed
    }
    if (icon !== undefined) cat.icon = icon?.trim() || null
    await cat.save()
    success(res, cat)
  }),
)

/**
 * DELETE /api/categories/:id  (admin)
 * Refuses deletion when restaurants still reference the category.
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const cat = await Category.findByPk(req.params.id)
    if (!cat) throw new ApiError(404, '分类不存在')
    const count = await Restaurant.count({ where: { categoryId: cat.id } })
    if (count > 0) {
      throw new ApiError(409, `该分类下仍有 ${count} 家餐厅，无法删除`)
    }
    await cat.destroy()
    success(res, { id: cat.id })
  }),
)

export default router

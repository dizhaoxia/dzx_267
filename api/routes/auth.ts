/**
 * User authentication: register / login / current user.
 * Passwords are hashed with bcryptjs; auth uses JWT.
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { User, type UserRole } from '../models/User.js'
import { signToken } from '../utils/jwt.js'
import { asyncHandler, ApiError, success } from '../utils/http.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

export interface PublicUser {
  id: number
  phone: string | null
  email: string | null
  name: string
  role: UserRole
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    phone: u.phone,
    email: u.email,
    name: u.name,
    role: u.role,
  }
}

function validateAccount(body: { phone?: string; email?: string }): void {
  const phone = body.phone?.trim()
  const email = body.email?.trim()
  if (!phone && !email) {
    throw new ApiError(400, '手机号和邮箱至少填写一项')
  }
}

/**
 * POST /api/auth/register
 * body: { name, password, role, phone?, email? }
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, password, role, phone, email } = req.body ?? {}
    if (!name || !String(name).trim()) {
      throw new ApiError(400, '昵称不能为空')
    }
    if (!password || String(password).length < 6) {
      throw new ApiError(400, '密码至少 6 位')
    }
    if (role && !['user', 'merchant'].includes(role)) {
      throw new ApiError(400, '角色非法')
    }
    validateAccount({ phone, email })

    const cleanPhone = phone?.trim() || null
    const cleanEmail = email?.trim().toLowerCase() || null

    const existing = await User.findOne({
      where: {
        [Op.or]: [
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    })
    if (existing) {
      throw new ApiError(409, '该手机号或邮箱已注册')
    }

    const hash = await bcrypt.hash(String(password), 10)
    const user = await User.create({
      name: String(name).trim(),
      password: hash,
      role: (role as UserRole) || 'user',
      phone: cleanPhone,
      email: cleanEmail,
    })

    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
    })
    success(res, { token, user: toPublicUser(user) }, 201)
  }),
)

/**
 * POST /api/auth/login
 * body: { account, password }  account may be phone or email
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { account, password } = req.body ?? {}
    if (!account || !password) {
      throw new ApiError(400, '请输入账号和密码')
    }
    const acc = String(account).trim().toLowerCase()
    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone: acc }, { email: acc }],
      },
    })
    if (!user) {
      throw new ApiError(401, '账号或密码错误')
    }
    const ok = await bcrypt.compare(String(password), user.password)
    if (!ok) {
      throw new ApiError(401, '账号或密码错误')
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
    })
    success(res, { token, user: toPublicUser(user) })
  }),
)

/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByPk(req.user!.userId)
    if (!user) {
      throw new ApiError(404, '用户不存在')
    }
    success(res, toPublicUser(user))
  }),
)

export default router

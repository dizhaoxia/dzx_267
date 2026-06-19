import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt'
import { ApiError } from '../utils/http'
import type { UserRole } from '../models/User'

/** Verify the bearer JWT and attach the decoded payload to req.user. */
export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, '未登录或缺少认证信息'))
  }
  const token = header.slice(7).trim()
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    next(new ApiError(401, '认证已过期，请重新登录'))
  }
}

/** Require the authenticated user to hold one of the given roles. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload | undefined
    if (!user) {
      return next(new ApiError(401, '未登录'))
    }
    if (!roles.includes(user.role)) {
      return next(new ApiError(403, '无权访问该资源'))
    }
    next()
  }
}

/** Convenience guard: must be logged in AND own the restaurant. */
export const requireSelfOrAdmin = (merchantIdOfResource: (req: Request) => number): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload | undefined
    if (!user) return next(new ApiError(401, '未登录'))
    if (user.role !== 'admin' && user.userId !== merchantIdOfResource(req)) {
      return next(new ApiError(403, '无权操作他人资源'))
    }
    next()
  }
}

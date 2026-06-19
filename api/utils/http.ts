import type { Request, Response, NextFunction, RequestHandler } from 'express'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>

/** Wrap an async route handler so rejected promises are forwarded to the error middleware. */
export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data })
}

export function paginate(res: Response, result: {
  list: unknown
  total: number
  page: number
  pageSize: number
}) {
  const { list, total, page, pageSize } = result
  return res.status(200).json({
    success: true,
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  })
}

/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import restaurantRoutes from './routes/restaurants.js'
import uploadRoutes from './routes/uploads.js'
import { ApiError } from './utils/http.js'
import { env } from './config/env.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'))

/**
 * Serve uploaded media statically from the project-root public/uploads dir.
 */
app.use(
  '/uploads',
  express.static(path.resolve(env.uploadRoot), {
    maxAge: '7d',
    immutable: true,
  }),
)

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/uploads', uploadRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: unknown, req: Request, res: Response) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
    })
    return
  }

  if (error instanceof Error) {
    // multer file filter errors surface as plain Errors
    if (error.message.startsWith('仅支持')) {
      res.status(400).json({ success: false, error: error.message })
      return
    }

    // multer: file too large (code = LIMIT_FILE_SIZE)
    // @ts-expect-error MulterError is a class with a `code` field
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, error: '上传图片过大，最大支持 10MB' })
      return
    }
    // multer: too many files / unexpected field
    // @ts-expect-error MulterError has `code`
    if (typeof error.code === 'string' && error.code.startsWith('LIMIT_')) {
      res.status(400).json({ success: false, error: '文件上传参数异常' })
      return
    }

    // express.json / urlencoded: payload too large
    // @ts-expect-error http-errors style `type` field
    if (error.type === 'entity.too.large' || error.message?.includes('too large')) {
      res.status(413).json({ success: false, error: '请求体过大，请减少数据后重试' })
      return
    }
    // express.json: malformed JSON body
    // @ts-expect-error SyntaxError has a body-parsing subtype
    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      res.status(400).json({ success: false, error: '请求数据格式错误，请检查输入' })
      return
    }
  }

  console.error('[unhandled error]', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  })
})

export default app

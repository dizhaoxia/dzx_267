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
  // multer file filter errors surface as plain Errors
  if (error instanceof Error && error.message.startsWith('仅支持')) {
    res.status(400).json({ success: false, error: error.message })
    return
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

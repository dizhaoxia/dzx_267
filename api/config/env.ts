import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

export const env = {
  port: Number(process.env.PORT) || 32211,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'food_discovery',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'food_discovery_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  uploadRoot: path.resolve(
    PROJECT_ROOT,
    process.env.UPLOAD_ROOT || 'public/uploads',
  ),
}

export const UPLOAD_DIRS = {
  restaurants: path.join(env.uploadRoot, 'restaurants'),
}

/** Make sure upload destination directories exist on disk. */
export function ensureUploadDirs(): void {
  for (const dir of Object.values(UPLOAD_DIRS)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Idempotent seed: ensure an admin account and a set of default categories exist.
 */
import bcrypt from 'bcryptjs'
import { User } from './models/User.js'
import { Category } from './models/Category.js'

const DEFAULT_CATEGORIES = [
  '川菜',
  '粤菜',
  '湘菜',
  '鲁菜',
  '苏菜',
  '浙菜',
  '日料',
  '韩餐',
  '西餐',
  '火锅',
  '烧烤',
  '烘焙甜品',
  '快餐简餐',
  '咖啡饮品',
  '其他',
]

const ADMIN_EMAIL = 'admin@food.local'
const ADMIN_PASSWORD = 'admin123'

export async function seedDefaults(): Promise<void> {
  // Admin account
  let admin = await User.findOne({ where: { email: ADMIN_EMAIL } })
  if (!admin) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    admin = await User.create({
      name: '管理员',
      email: ADMIN_EMAIL,
      password: hash,
      role: 'admin',
      phone: null,
    })
    console.log(`[seed] created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  }

  // Categories
  const existing = (await Category.findAll()).map((c) => c.name)
  const missing = DEFAULT_CATEGORIES.filter((n) => !existing.includes(n))
  if (missing.length) {
    await Category.bulkCreate(missing.map((name) => ({ name })))
    console.log(`[seed] added ${missing.length} categories`)
  }
}

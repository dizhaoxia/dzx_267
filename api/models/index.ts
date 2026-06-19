import { sequelize } from '../config/db'
import { User } from './User'
import { Category } from './Category'
import { Restaurant } from './Restaurant'

export { User, Category, Restaurant }

/**
 * Wire up associations.
 * With `underscored: true`, attribute keys are camelCase and column names are snake_case.
 */
User.hasMany(Restaurant, { foreignKey: 'merchantId', as: 'restaurants' })
Restaurant.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' })

Category.hasMany(Restaurant, { foreignKey: 'categoryId', as: 'restaurants' })
Restaurant.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

/**
 * Create tables if they do not exist (does NOT alter existing tables).
 */
export async function syncModels(): Promise<void> {
  await sequelize.sync()
}

/**
 * Ensure a FULLTEXT index with the ngram parser exists on
 * (name, address, tags) so Chinese full-text search works on MySQL 8+.
 * Sequelize cannot declare `WITH PARSER ngram` via model options, so we add it manually.
 */
export async function ensureFullTextIndex(): Promise<void> {
  const [rows] = (await sequelize.query(
    `SHOW INDEX FROM restaurants WHERE Key_name = 'ft_name_addr_tags'`,
  )) as [unknown[], unknown]
  if (!Array.isArray(rows) || rows.length === 0) {
    await sequelize.query(
      `CREATE FULLTEXT INDEX ft_name_addr_tags ON restaurants (name, address, tags) WITH PARSER ngram`,
    )
    console.log('[db] created FULLTEXT(ngram) index on restaurants(name, address, tags)')
  }
}

export async function initDatabase(): Promise<void> {
  await syncModels()
  await ensureFullTextIndex()
}

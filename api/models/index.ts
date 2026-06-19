import { sequelize } from '../config/db'
import { User } from './User'
import { Category } from './Category'
import { Restaurant } from './Restaurant'
import { Checkin } from './Checkin'
import { Review } from './Review'
import { Favorite } from './Favorite'

export { User, Category, Restaurant, Checkin, Review, Favorite }

User.hasMany(Restaurant, { foreignKey: 'merchantId', as: 'restaurants' })
Restaurant.belongsTo(User, { foreignKey: 'merchantId', as: 'merchant' })

Category.hasMany(Restaurant, { foreignKey: 'categoryId', as: 'restaurants' })
Restaurant.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

User.hasMany(Checkin, { foreignKey: 'userId', as: 'checkins' })
Checkin.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Restaurant.hasMany(Checkin, { foreignKey: 'restaurantId', as: 'checkins' })
Checkin.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' })
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Restaurant.hasMany(Review, { foreignKey: 'restaurantId', as: 'reviews' })
Review.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' })
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Restaurant.hasMany(Favorite, { foreignKey: 'restaurantId', as: 'favorites' })
Favorite.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })

export async function syncModels(): Promise<void> {
  await sequelize.sync()
}

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

/**
 * Ensure the ranking columns (hot_score / rating_score) exist on the
 * restaurants table. `sequelize.sync()` only creates missing tables, so for an
 * already-existing table we ALTER it idempotently. Also adds supporting indexes
 * used by the 热度榜 / 好评榜 ORDER BY clauses.
 */
export async function ensureRankingColumns(): Promise<void> {
  type ColRow = { Field: string }
  const [cols] = (await sequelize.query(
    `SHOW COLUMNS FROM restaurants WHERE Field IN ('hot_score','rating_score')`,
  )) as [ColRow[], unknown]
  const existing = new Set((cols ?? []).map((c) => c.Field))

  if (!existing.has('hot_score')) {
    await sequelize.query(
      `ALTER TABLE restaurants ADD COLUMN hot_score DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '热度分 = 近7天打卡数*0.6 + 近7天收藏数*0.4，由定时聚合任务更新'`,
    )
    console.log('[db] added column restaurants.hot_score')
  }
  if (!existing.has('rating_score')) {
    await sequelize.query(
      `ALTER TABLE restaurants ADD COLUMN rating_score DECIMAL(4,2) NOT NULL DEFAULT 0 COMMENT '好评榜排序分，取 reviews 表 AVG(rating) 精确值，由定时聚合任务更新'`,
    )
    console.log('[db] added column restaurants.rating_score')
  }

  type IdxRow = { Key_name: string }
  const [idx] = (await sequelize.query(
    `SHOW INDEX FROM restaurants WHERE Key_name IN ('restaurants_hot_score','restaurants_rating_score')`,
  )) as [IdxRow[], unknown]
  const idxNames = new Set((idx ?? []).map((r) => r.Key_name))
  if (!idxNames.has('restaurants_hot_score')) {
    await sequelize.query(`ALTER TABLE restaurants ADD INDEX restaurants_hot_score (hot_score)`)
  }
  if (!idxNames.has('restaurants_rating_score')) {
    await sequelize.query(
      `ALTER TABLE restaurants ADD INDEX restaurants_rating_score (rating_score)`,
    )
  }
}

export async function initDatabase(): Promise<void> {
  await syncModels()
  await ensureFullTextIndex()
  await ensureRankingColumns()
}

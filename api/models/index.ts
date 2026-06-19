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

export async function initDatabase(): Promise<void> {
  await syncModels()
  await ensureFullTextIndex()
}

import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export type RestaurantStatus = 'published' | 'offline'

export class Restaurant extends Model {
  declare id: number
  declare merchantId: number
  declare name: string
  declare address: string
  declare categoryId: number
  declare longitude: number | null
  declare latitude: number | null
  declare phone: string | null
  declare businessHours: string | null
  declare tags: string | null
  declare description: string | null
  declare coverImage: string | null
  declare coverThumb: string | null
  declare status: RestaurantStatus
  declare avgRating: number
  declare ratingCount: number
  declare hotScore: number
  declare ratingScore: number
  declare createdAt: Date
  declare updatedAt: Date
}

Restaurant.init(
  {
    merchantId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      validate: { min: -180, max: 180 },
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      validate: { min: -90, max: 90 },
    },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    businessHours: { type: DataTypes.STRING(100), allowNull: true },
    tags: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    coverImage: { type: DataTypes.STRING(500), allowNull: true },
    coverThumb: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM('published', 'offline'),
      allowNull: false,
      defaultValue: 'published',
    },
    avgRating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0,
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    hotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '热度分 = 近7天打卡数*0.6 + 近7天收藏数*0.4，由定时聚合任务更新',
    },
    ratingScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '好评榜排序分，取 reviews 表 AVG(rating) 精确值，由定时聚合任务更新',
    },
  },
  {
    sequelize,
    tableName: 'restaurants',
    modelName: 'Restaurant',
    underscored: true,
    // NOTE: hot_score / rating_score 的索引不在此声明，而由 ensureRankingColumns()
    // 在 ALTER TABLE 加列之后再创建。否则 sequelize.sync() 对已存在的旧表会先尝试
    // 建索引（引用尚不存在的列）而报 ER_KEY_COLUMN_DOES_NOT_EXITS。
    indexes: [
      { fields: ['merchant_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
    ],
  },
)

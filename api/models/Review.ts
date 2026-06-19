import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class Review extends Model {
  declare id: number
  declare userId: number
  declare restaurantId: number
  declare rating: number
  declare content: string | null
  declare photos: string | null
  declare photoThumbs: string | null
  declare createdAt: Date
  declare updatedAt: Date
}

Review.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON 数组，存储原始图片路径',
    },
    photoThumbs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON 数组，存储缩略图路径',
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    modelName: 'Review',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['created_at'] },
      { fields: ['restaurant_id', 'rating'] },
    ],
  },
)

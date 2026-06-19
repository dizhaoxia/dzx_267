import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class Checkin extends Model {
  declare id: number
  declare userId: number
  declare restaurantId: number
  declare latitude: number
  declare longitude: number
  declare distance: number
  declare photos: string
  declare photoThumbs: string
  declare createdAt: Date
  declare updatedAt: Date
}

Checkin.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: { min: -90, max: 90 },
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: { min: -180, max: 180 },
    },
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: '打卡时与餐厅的距离（米）',
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
    tableName: 'checkins',
    modelName: 'Checkin',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['created_at'] },
      { fields: ['user_id', 'restaurant_id'] },
    ],
  },
)

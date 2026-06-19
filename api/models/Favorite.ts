import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class Favorite extends Model {
  declare id: number
  declare userId: number
  declare restaurantId: number
  declare createdAt: Date
}

Favorite.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'favorites',
    modelName: 'Favorite',
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['restaurant_id'] },
      {
        fields: ['user_id', 'restaurant_id'],
        unique: true,
        name: 'uniq_user_restaurant',
      },
    ],
  },
)

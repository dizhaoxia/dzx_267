import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class Category extends Model {
  declare id: number
  declare name: string
  declare icon: string | null
  declare createdAt: Date
  declare updatedAt: Date
}

Category.init(
  {
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    icon: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    underscored: true,
  },
)

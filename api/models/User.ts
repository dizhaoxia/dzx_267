import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export type UserRole = 'user' | 'merchant' | 'admin'

export class User extends Model {
  declare id: number
  declare phone: string | null
  declare email: string | null
  declare password: string
  declare name: string
  declare role: UserRole
  declare createdAt: Date
  declare updatedAt: Date
}

User.init(
  {
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        is: /^[0-9+\-\s]{6,20}$/,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    role: {
      type: DataTypes.ENUM('user', 'merchant', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    underscored: true,
  },
)

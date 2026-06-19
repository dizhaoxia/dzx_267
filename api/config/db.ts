import { Sequelize } from 'sequelize'
import mysql from 'mysql2/promise'
import { env } from './env'

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
  dialectOptions: {
    charset: 'utf8mb4',
    decimalNumbers: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
})

/**
 * Create the target database if it does not exist.
 * Sequelize needs the database to already exist before connecting.
 */
export async function ensureDatabase(): Promise<void> {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  })
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    )
  } finally {
    await conn.end()
  }
}

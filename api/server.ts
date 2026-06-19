/**
 * local server entry file, for local development
 */
import app from './app.js'
import { env, ensureUploadDirs } from './config/env.js'
import { sequelize, ensureDatabase } from './config/db.js'
import { initDatabase } from './models/index.js'
import { seedDefaults } from './seed.js'
import { startScheduler, stopScheduler } from './tasks/scheduler.js'

async function bootstrap() {
  // Make sure upload directories exist on disk.
  ensureUploadDirs()

  // Create the MySQL database if missing, then connect Sequelize.
  await ensureDatabase()
  await sequelize.authenticate()
  console.log('[db] connected')

  // Create tables + FULLTEXT(ngram) index + ranking columns.
  await initDatabase()

  // Seed admin + default categories (idempotent).
  await seedDefaults()

  const PORT = env.port
  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`)
  })

  // Start the in-process cron scheduler (daily hot-score aggregation).
  startScheduler()

  const shutdown = (signal: string) => {
    console.log(`${signal} signal received`)
    stopScheduler()
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('[bootstrap] failed', err)
  process.exit(1)
})

export default app

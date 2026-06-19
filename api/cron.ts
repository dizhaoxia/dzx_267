/**
 * 独立热度聚合脚本：一次性执行后退出，适合由系统 crontab 或外部调度器每日触发。
 *
 * 运行方式：
 *   pnpm cron            （或 npm run cron）
 *
 * 系统 crontab 示例（每日凌晨 02:00 执行）：
 *   0 2 * * * cd /path/to/dzx_267 && /usr/bin/env npm run cron >> logs/cron.log 2>&1
 *
 * 与应用内 node-cron 调度器共用同一把文件锁，二者同时触发时只会有一份执行。
 */
import { ensureDatabase, sequelize } from './config/db.js'
import { initDatabase } from './models/index.js'
import { aggregateHotScores } from './tasks/aggregate.js'
import { withLock } from './tasks/lock.js'

const LOCK_NAME = 'aggregate-hot-scores'

async function main(): Promise<void> {
  await ensureDatabase()
  await sequelize.authenticate()
  console.log('[db] connected')

  // 确保排序字段已存在（兼容已建表的历史库）。
  await initDatabase()

  const result = await withLock(LOCK_NAME, () => aggregateHotScores())
  if (!result) {
    console.log('[cron] another instance holds the lock, exiting')
    return
  }

  console.log(
    `[cron] aggregateHotScores done — affected ${result.affectedRows}, changed ${result.changedRows}`,
  )
  if (result.topHot.length) {
    console.log(
      '[cron] 热度榜 Top5:',
      result.topHot.map((r) => `${r.name}(${r.score})`).join(', '),
    )
  }
  if (result.topRating.length) {
    console.log(
      '[cron] 好评榜 Top5:',
      result.topRating.map((r) => `${r.name}(${r.score})`).join(', '),
    )
  }
}

main()
  .then(() => {
    void sequelize.close()
    process.exit(0)
  })
  .catch((err) => {
    console.error('[cron] failed', err)
    void sequelize.close().finally(() => process.exit(1))
  })

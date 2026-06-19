/**
 * 应用内 node-cron 调度器：随 server.ts 启动，每日凌晨触发热度聚合。
 * 通过共享文件锁（与独立 cron 脚本同一把锁）保证单实例运行——即便部署了
 * 多个应用进程或同时配置了系统 crontab，同一时刻也只会有一份任务真正执行。
 *
 * 仅在长驻进程 server.ts 中启动；Vercel 等 serverless 入口（api/index.ts）
 * 不调用本模块，避免在无状态函数中误触发。
 */
import cron, { type ScheduledTask } from 'node-cron'
import { env } from '../config/env.js'
import { aggregateHotScores } from './aggregate.js'
import { withLock } from './lock.js'

const LOCK_NAME = 'aggregate-hot-scores'

let scheduled: ScheduledTask | null = null

export function startScheduler(): void {
  if (!env.cron.enabled) {
    console.log('[cron] scheduler disabled (CRON_ENABLED=false)')
    return
  }
  if (!cron.validate(env.cron.expression)) {
    console.warn(
      `[cron] invalid expression "${env.cron.expression}", scheduler not started`,
    )
    return
  }

  scheduled = cron.schedule(env.cron.expression, async () => {
    const at = new Date().toISOString()
    console.log(`[cron] aggregateHotScores triggered at ${at}`)
    try {
      const result = await withLock(LOCK_NAME, () => aggregateHotScores())
      if (!result) {
        console.log('[cron] another instance holds the lock, skipped')
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
    } catch (err) {
      console.error('[cron] aggregateHotScores failed', err)
    }
  })

  console.log(`[cron] scheduler started: "${env.cron.expression}"`)
}

export function stopScheduler(): void {
  if (scheduled) {
    scheduled.stop()
    scheduled = null
    console.log('[cron] scheduler stopped')
  }
}

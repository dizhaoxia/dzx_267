/**
 * 单实例文件锁：保证定时聚合任务在同一台机器上同一时刻只运行一份。
 * 既用于应用内 node-cron 调度，也用于独立 cron 脚本，二者共用同一把锁，
 * 因此即便系统 crontab 与应用内调度同时触发，也只会有一份真正执行。
 *
 * 策略：用 `fs.openSync(path, 'wx')` 独占创建锁文件并写入 PID；若文件已存在，
 * 检查持有者 PID 是否存活，存活则放弃（返回 null），已死亡则视为陈旧锁并抢占。
 */
import fs from 'fs'
import path from 'path'
import { env } from '../config/env.js'

export interface LockHandle {
  release: () => void
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function ensureLockDir(): void {
  fs.mkdirSync(env.cron.lockDir, { recursive: true })
}

function lockFilePath(name: string): string {
  return path.join(env.cron.lockDir, `${name}.lock`)
}

function writeOwner(fd: number): void {
  fs.writeFileSync(fd, `${process.pid}:${Date.now()}\n`)
}

/**
 * 尝试获取命名锁。成功返回带 release() 的句柄；已被其它存活进程持有时返回 null。
 */
export function acquireLock(name: string): LockHandle | null {
  ensureLockDir()
  const file = lockFilePath(name)

  let fd = -1
  try {
    fd = fs.openSync(file, 'wx')
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code !== 'EEXIST') throw err

    // 锁文件已存在，判断持有者是否仍存活。
    let holderPid = 0
    try {
      const content = fs.readFileSync(file, 'utf8')
      holderPid = Number(content.split(':')[0]) || 0
    } catch {
      holderPid = 0
    }

    if (holderPid && isPidAlive(holderPid)) {
      return null
    }

    // 陈旧锁：清理后重新抢占。
    try {
      fs.unlinkSync(file)
    } catch {
      /* ignore */
    }
    try {
      fd = fs.openSync(file, 'wx')
    } catch {
      return null
    }
  }

  writeOwner(fd)
  fs.closeSync(fd)

  return {
    release: () => {
      try {
        fs.unlinkSync(file)
      } catch {
        /* ignore */
      }
    },
  }
}

/**
 * 在持锁状态下执行 fn，执行完毕（无论成功与否）自动释放锁。
 * 若未能获取锁则返回 null，调用方可据此跳过本次执行。
 */
export async function withLock<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  const handle = acquireLock(name)
  if (!handle) return null
  try {
    return await fn()
  } finally {
    handle.release()
  }
}

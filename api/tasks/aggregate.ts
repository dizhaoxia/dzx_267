/**
 * 热度聚合任务：统计每个餐厅近 7 天的打卡数 / 收藏数与全量平均评分，
 * 据此重算并回写 restaurants 表的 hot_score 与 rating_score。
 *
 *   hot_score    = 近7天打卡数 * 0.6 + 近7天收藏数 * 0.4
 *   rating_score = reviews 表 AVG(rating) 精确值（好评榜排序依据）
 *
 * 采用单条多表 UPDATE，在事务中原子完成全量刷新；无近期活跃的餐厅会被置 0，
 * 保证榜单随时间衰减。该函数被应用内 node-cron 调度与独立 cron 脚本共用。
 */
import { sequelize } from '../config/db.js'

export interface RankRow {
  id: number
  name: string
  score: string
}

export interface AggregateResult {
  affectedRows: number
  changedRows: number
  topHot: RankRow[]
  topRating: RankRow[]
}

interface ResultSetHeader {
  affectedRows?: number
  changedRows?: number
}

const UPDATE_SQL = `
  UPDATE restaurants r
  LEFT JOIN (
    SELECT restaurant_id, COUNT(*) AS checkin_count
    FROM checkins
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY restaurant_id
  ) c ON c.restaurant_id = r.id
  LEFT JOIN (
    SELECT restaurant_id, COUNT(*) AS favorite_count
    FROM favorites
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY restaurant_id
  ) f ON f.restaurant_id = r.id
  LEFT JOIN (
    SELECT restaurant_id, AVG(rating) AS avg_rating
    FROM reviews
    GROUP BY restaurant_id
  ) rv ON rv.restaurant_id = r.id
  SET
    r.hot_score    = COALESCE(c.checkin_count, 0) * 0.6 + COALESCE(f.favorite_count, 0) * 0.4,
    r.rating_score = COALESCE(rv.avg_rating, 0)
`

export async function aggregateHotScores(): Promise<AggregateResult> {
  const t = await sequelize.transaction()
  try {
    const [result] = (await sequelize.query(UPDATE_SQL, { transaction: t })) as [
      ResultSetHeader,
      unknown,
    ]
    await t.commit()

    const [topHot] = (await sequelize.query(
      `SELECT id, name, CAST(hot_score AS CHAR) AS score
       FROM restaurants ORDER BY hot_score DESC, rating_score DESC, created_at DESC LIMIT 5`,
    )) as [RankRow[], unknown]

    const [topRating] = (await sequelize.query(
      `SELECT id, name, CAST(rating_score AS CHAR) AS score
       FROM restaurants ORDER BY rating_score DESC, rating_count DESC, created_at DESC LIMIT 5`,
    )) as [RankRow[], unknown]

    return {
      affectedRows: result?.affectedRows ?? 0,
      changedRows: result?.changedRows ?? 0,
      topHot: topHot ?? [],
      topRating: topRating ?? [],
    }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

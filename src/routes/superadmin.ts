// 슈퍼어드민 라우트
import { Hono } from 'hono'
import { authMiddleware, superAdminMiddleware } from '../middleware/auth'
import { isExpired } from '../lib/utils'
import type { Bindings, JWTPayload } from '../types'

type Variables = { user: JWTPayload }

const superAdmin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 모든 슈퍼어드민 라우트에 인증 미들웨어 적용
superAdmin.use('*', authMiddleware)
superAdmin.use('*', superAdminMiddleware)

// 전체 통계
superAdmin.get('/stats', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').bind('admin').first() as any
    const totalWeddings = await c.env.DB.prepare('SELECT COUNT(*) as count FROM weddings').first() as any
    const totalUploads = await c.env.DB.prepare('SELECT COUNT(*) as count, SUM(file_size) as total_size FROM uploads').first() as any
    const totalGuests = await c.env.DB.prepare('SELECT COUNT(*) as count FROM guests').first() as any

    const planStats = await c.env.DB.prepare(`
      SELECT plan_id, COUNT(*) as count FROM weddings GROUP BY plan_id
    `).all()

    return c.json({
      stats: {
        total_users: totalUsers?.count || 0,
        total_weddings: totalWeddings?.count || 0,
        total_uploads: totalUploads?.count || 0,
        total_storage_bytes: totalUploads?.total_size || 0,
        total_guests: totalGuests?.count || 0,
        plan_distribution: planStats.results
      }
    })
  } catch (error) {
    return c.json({ error: '통계를 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

// 전체 웨딩 목록
superAdmin.get('/weddings', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit
    const search = c.req.query('search') || ''

    let query = `
      SELECT w.*, u.email as owner_email, u.name as owner_name,
             p.name as plan_name,
             (SELECT COUNT(*) FROM uploads WHERE wedding_id = w.id) as upload_count,
             (SELECT SUM(file_size) FROM uploads WHERE wedding_id = w.id) as total_size
      FROM weddings w
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN plans p ON w.plan_id = p.id
    `

    if (search) {
      query += ` WHERE w.bride_name LIKE '%${search}%' OR w.groom_name LIKE '%${search}%' OR u.email LIKE '%${search}%'`
    }

    query += ` ORDER BY w.created_at DESC LIMIT ${limit} OFFSET ${offset}`

    const weddings = await c.env.DB.prepare(query).all()
    const total = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM weddings`).first() as any

    return c.json({
      weddings: weddings.results,
      total: total?.count || 0,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: '웨딩 목록을 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

// 웨딩 강제 비활성화
superAdmin.put('/weddings/:id/disable', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(
      'UPDATE weddings SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run()
    return c.json({ success: true, message: '웨딩이 비활성화되었습니다.' })
  } catch (error) {
    return c.json({ error: '웨딩 비활성화 중 오류가 발생했습니다.' }, 500)
  }
})

// 웨딩 활성화
superAdmin.put('/weddings/:id/enable', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(
      'UPDATE weddings SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run()
    return c.json({ success: true, message: '웨딩이 활성화되었습니다.' })
  } catch (error) {
    return c.json({ error: '웨딩 활성화 중 오류가 발생했습니다.' }, 500)
  }
})

// 플랜 수동 연장
superAdmin.put('/weddings/:id/extend-plan', async (c) => {
  try {
    const id = c.req.param('id')
    const { plan_id, custom_days } = await c.req.json()

    const wedding = await c.env.DB.prepare('SELECT * FROM weddings WHERE id = ?').bind(id).first() as any
    if (!wedding) {
      return c.json({ error: '웨딩을 찾을 수 없습니다.' }, 404)
    }

    let expiresAt = null
    if (custom_days) {
      const date = new Date(wedding.wedding_date)
      date.setDate(date.getDate() + parseInt(custom_days))
      expiresAt = date.toISOString()
    } else if (plan_id) {
      const plan = await c.env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(plan_id).first() as any
      if (plan && plan.duration_days) {
        const date = new Date(wedding.wedding_date)
        date.setDate(date.getDate() + plan.duration_days)
        expiresAt = date.toISOString()
      }
    }

    await c.env.DB.prepare(
      'UPDATE weddings SET plan_id = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(plan_id || wedding.plan_id, expiresAt, id).run()

    return c.json({ success: true, message: '플랜이 연장되었습니다.' })
  } catch (error) {
    return c.json({ error: '플랜 연장 중 오류가 발생했습니다.' }, 500)
  }
})

// 업로드 파일 삭제 (어뷰징 처리)
superAdmin.delete('/uploads/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId')

    const upload = await c.env.DB.prepare('SELECT * FROM uploads WHERE id = ?').bind(uploadId).first() as any
    if (!upload) {
      return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)
    }

    if (c.env.R2) {
      await c.env.R2.delete(upload.file_key)
    }

    await c.env.DB.prepare('DELETE FROM uploads WHERE id = ?').bind(uploadId).run()

    return c.json({ success: true, message: '파일이 삭제되었습니다.' })
  } catch (error) {
    return c.json({ error: '파일 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 전체 사용자 목록
superAdmin.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    const users = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
             (SELECT COUNT(*) FROM weddings WHERE user_id = u.id) as wedding_count
      FROM users u
      WHERE u.role != 'superadmin'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    const total = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role != 'superadmin'"
    ).first() as any

    return c.json({
      users: users.results,
      total: total?.count || 0
    })
  } catch (error) {
    return c.json({ error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

export default superAdmin

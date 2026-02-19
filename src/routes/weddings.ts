// 웨딩 관리 라우트
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { generateId, calculateExpiryDate, isExpired, generateWeddingURL } from '../lib/utils'
import type { Bindings, JWTPayload } from '../types'

type Variables = { user: JWTPayload }

const weddings = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 웨딩 생성/수정
weddings.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const {
      bride_name, groom_name, wedding_date, venue_name,
      wedding_time, contact_email, plan_id
    } = body

    if (!bride_name || !groom_name || !wedding_date || !contact_email) {
      return c.json({ error: '신부 이름, 신랑 이름, 웨딩 날짜, 연락처 이메일은 필수입니다.' }, 400)
    }

    // 기존 웨딩 확인 (사용자당 1개)
    const existing = await c.env.DB.prepare(
      'SELECT id FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    // 플랜 정보 조회
    const planId = plan_id || 'plan_a'
    const plan = await c.env.DB.prepare(
      'SELECT * FROM plans WHERE id = ?'
    ).bind(planId).first() as any

    const expiresAt = calculateExpiryDate(wedding_date, plan?.duration_days ?? 3)

    if (existing) {
      // 기존 웨딩 업데이트
      await c.env.DB.prepare(`
        UPDATE weddings SET 
          bride_name = ?, groom_name = ?, wedding_date = ?, venue_name = ?,
          wedding_time = ?, contact_email = ?, plan_id = ?, expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        bride_name, groom_name, wedding_date, venue_name || null,
        wedding_time || null, contact_email, planId, expiresAt,
        existing.id
      ).run()

      const updated = await c.env.DB.prepare(
        'SELECT * FROM weddings WHERE id = ?'
      ).bind(existing.id).first()

      return c.json({ success: true, wedding: updated })
    } else {
      // 새 웨딩 생성
      const id = generateId()
      await c.env.DB.prepare(`
        INSERT INTO weddings (
          id, user_id, bride_name, groom_name, wedding_date, venue_name,
          wedding_time, contact_email, plan_id, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, user.sub, bride_name, groom_name, wedding_date, venue_name || null,
        wedding_time || null, contact_email, planId, expiresAt
      ).run()

      const wedding = await c.env.DB.prepare(
        'SELECT * FROM weddings WHERE id = ?'
      ).bind(id).first()

      return c.json({ success: true, wedding })
    }
  } catch (error) {
    console.error('Wedding create error:', error)
    return c.json({ error: '웨딩 정보 저장 중 오류가 발생했습니다.' }, 500)
  }
})

// 내 웨딩 조회
weddings.get('/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const wedding = await c.env.DB.prepare(
      'SELECT w.*, p.name as plan_name, p.duration_days FROM weddings w LEFT JOIN plans p ON w.plan_id = p.id WHERE w.user_id = ?'
    ).bind(user.sub).first()

    if (!wedding) {
      return c.json({ wedding: null })
    }

    // 업로드 통계
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN file_type = 'photo' THEN 1 ELSE 0 END) as photo_count,
        SUM(CASE WHEN file_type = 'video' THEN 1 ELSE 0 END) as video_count,
        SUM(file_size) as total_size
      FROM uploads WHERE wedding_id = ?
    `).bind((wedding as any).id).first()

    return c.json({ wedding, stats })
  } catch (error) {
    return c.json({ error: '웨딩 정보를 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

// 플랜 업그레이드
weddings.put('/plan', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { plan_id } = await c.req.json()

    if (!['plan_a', 'plan_b', 'plan_c'].includes(plan_id)) {
      return c.json({ error: '유효한 플랜을 선택해주세요.' }, 400)
    }

    const wedding = await c.env.DB.prepare(
      'SELECT * FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ error: '웨딩 정보를 먼저 등록해주세요.' }, 404)
    }

    const plan = await c.env.DB.prepare(
      'SELECT * FROM plans WHERE id = ?'
    ).bind(plan_id).first() as any

    const expiresAt = calculateExpiryDate(wedding.wedding_date, plan?.duration_days ?? null)

    await c.env.DB.prepare(
      'UPDATE weddings SET plan_id = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(plan_id, expiresAt, user.sub).run()

    return c.json({ success: true, message: '플랜이 업그레이드되었습니다.' })
  } catch (error) {
    return c.json({ error: '플랜 변경 중 오류가 발생했습니다.' }, 500)
  }
})

// 공개 웨딩 정보 조회 (게스트용)
weddings.get('/:id/public', async (c) => {
  try {
    const id = c.req.param('id')
    const wedding = await c.env.DB.prepare(
      'SELECT id, bride_name, groom_name, wedding_date, venue_name, wedding_time, cover_image_url, is_active, upload_disabled, expires_at, plan_id FROM weddings WHERE id = ?'
    ).bind(id).first() as any

    if (!wedding) {
      return c.json({ error: '존재하지 않는 웨딩입니다.' }, 404)
    }

    if (!wedding.is_active) {
      return c.json({ error: '비활성화된 웨딩입니다.' }, 403)
    }

    const expired = isExpired(wedding.expires_at)
    
    return c.json({
      wedding: {
        ...wedding,
        is_expired: expired,
        upload_disabled: wedding.upload_disabled || expired
      }
    })
  } catch (error) {
    return c.json({ error: '웨딩 정보를 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

// 업로드 비활성화 토글
weddings.put('/toggle-upload', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const wedding = await c.env.DB.prepare(
      'SELECT * FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ error: '웨딩 정보를 먼저 등록해주세요.' }, 404)
    }

    const newState = wedding.upload_disabled ? 0 : 1
    await c.env.DB.prepare(
      'UPDATE weddings SET upload_disabled = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(newState, user.sub).run()

    return c.json({
      success: true,
      upload_disabled: newState === 1,
      message: newState ? '업로드가 비활성화되었습니다.' : '업로드가 활성화되었습니다.'
    })
  } catch (error) {
    return c.json({ error: '설정 변경 중 오류가 발생했습니다.' }, 500)
  }
})

export default weddings

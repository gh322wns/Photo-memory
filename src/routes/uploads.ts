// 파일 업로드 라우트 (R2 스토리지)
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { generateId, getFileType, isExpired } from '../lib/utils'
import type { Bindings, JWTPayload } from '../types'

type Variables = { user: JWTPayload }

const uploads = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/mov'
]

// 게스트 파일 업로드
uploads.post('/guest/:weddingId', async (c) => {
  try {
    const weddingId = c.req.param('weddingId')
    const guestName = c.req.header('X-Guest-Name') || ''

    if (!guestName.trim()) {
      return c.json({ error: '게스트 이름이 필요합니다.' }, 400)
    }

    // 웨딩 존재 및 상태 확인
    const wedding = await c.env.DB.prepare(
      'SELECT * FROM weddings WHERE id = ? AND is_active = 1'
    ).bind(weddingId).first() as any

    if (!wedding) {
      return c.json({ error: '존재하지 않는 웨딩입니다.' }, 404)
    }

    if (wedding.upload_disabled) {
      return c.json({ error: '업로드가 비활성화되었습니다.' }, 403)
    }

    if (isExpired(wedding.expires_at) && wedding.plan_id !== 'plan_c') {
      return c.json({ error: '웨딩 플랜이 만료되어 업로드할 수 없습니다.' }, 403)
    }

    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: '파일을 선택해주세요.' }, 400)
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: '파일 크기는 500MB를 초과할 수 없습니다.' }, 400)
    }

    // 파일 타입 확인
    const mimeType = file.type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return c.json({ error: '지원하지 않는 파일 형식입니다. JPG, PNG, HEIC, MP4, MOV만 업로드 가능합니다.' }, 400)
    }

    const fileType = getFileType(mimeType)
    if (!fileType) {
      return c.json({ error: '지원하지 않는 파일 형식입니다.' }, 400)
    }

    // R2에 업로드
    const fileId = generateId()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileKey = `weddings/${weddingId}/${fileId}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    if (c.env.R2) {
      await c.env.R2.put(fileKey, arrayBuffer, {
        httpMetadata: { contentType: mimeType },
        customMetadata: {
          weddingId,
          guestName,
          originalName: file.name
        }
      })
    }

    // DB에 업로드 정보 저장
    const uploadId = generateId()
    await c.env.DB.prepare(`
      INSERT INTO uploads (id, wedding_id, guest_name, file_key, file_name, file_type, file_size, mime_type, device_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uploadId, weddingId, guestName.trim(), fileKey, file.name,
      fileType, file.size, mimeType,
      c.req.header('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    ).run()

    // 게스트 정보 기록 (이미 있으면 업데이트)
    const existingGuest = await c.env.DB.prepare(
      'SELECT id FROM guests WHERE wedding_id = ? AND name = ?'
    ).bind(weddingId, guestName.trim()).first()

    if (!existingGuest) {
      await c.env.DB.prepare(
        'INSERT INTO guests (id, wedding_id, name, device_type) VALUES (?, ?, ?, ?)'
      ).bind(
        generateId(), weddingId, guestName.trim(),
        c.req.header('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      ).run()
    }

    return c.json({
      success: true,
      upload: {
        id: uploadId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size
      },
      message: '파일이 성공적으로 업로드되었습니다.'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, 500)
  }
})

// 어드민 - 내 웨딩 업로드 목록 조회
uploads.get('/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    const wedding = await c.env.DB.prepare(
      'SELECT id FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ uploads: [], total: 0 })
    }

    const uploads = await c.env.DB.prepare(
      'SELECT * FROM uploads WHERE wedding_id = ? ORDER BY upload_at DESC LIMIT ? OFFSET ?'
    ).bind(wedding.id, limit, offset).all()

    const total = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM uploads WHERE wedding_id = ?'
    ).bind(wedding.id).first() as any

    return c.json({
      uploads: uploads.results,
      total: total?.count || 0,
      page,
      limit
    })
  } catch (error) {
    return c.json({ error: '업로드 목록을 불러오는 중 오류가 발생했습니다.' }, 500)
  }
})

// 파일 다운로드 URL 생성 (서명된 URL)
uploads.get('/download/:uploadId', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const uploadId = c.req.param('uploadId')

    const wedding = await c.env.DB.prepare(
      'SELECT * FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ error: '웨딩 정보를 찾을 수 없습니다.' }, 404)
    }

    // 플랜 만료 확인
    if (isExpired(wedding.expires_at) && wedding.plan_id !== 'plan_c') {
      return c.json({ error: '플랜이 만료되어 다운로드할 수 없습니다.' }, 403)
    }

    const upload = await c.env.DB.prepare(
      'SELECT * FROM uploads WHERE id = ? AND wedding_id = ?'
    ).bind(uploadId, wedding.id).first() as any

    if (!upload) {
      return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)
    }

    if (!c.env.R2) {
      return c.json({ error: 'R2 스토리지가 설정되지 않았습니다.' }, 500)
    }

    // R2에서 파일 가져오기
    const object = await c.env.R2.get(upload.file_key)
    if (!object) {
      return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)
    }

    const headers = new Headers()
    headers.set('Content-Type', upload.mime_type)
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(upload.file_name)}"`)
    if (upload.file_size) {
      headers.set('Content-Length', upload.file_size.toString())
    }

    return new Response(object.body, { headers })
  } catch (error) {
    return c.json({ error: '파일 다운로드 중 오류가 발생했습니다.' }, 500)
  }
})

// 파일 삭제
uploads.delete('/:uploadId', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const uploadId = c.req.param('uploadId')

    const wedding = await c.env.DB.prepare(
      'SELECT id FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ error: '웨딩 정보를 찾을 수 없습니다.' }, 404)
    }

    const upload = await c.env.DB.prepare(
      'SELECT * FROM uploads WHERE id = ? AND wedding_id = ?'
    ).bind(uploadId, wedding.id).first() as any

    if (!upload) {
      return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)
    }

    // R2에서 삭제
    if (c.env.R2) {
      await c.env.R2.delete(upload.file_key)
    }

    // DB에서 삭제
    await c.env.DB.prepare('DELETE FROM uploads WHERE id = ?').bind(uploadId).run()

    return c.json({ success: true, message: '파일이 삭제되었습니다.' })
  } catch (error) {
    return c.json({ error: '파일 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 커버 이미지 업로드
uploads.post('/cover', authMiddleware, async (c) => {
  try {
    const user = c.get('user')

    const wedding = await c.env.DB.prepare(
      'SELECT id FROM weddings WHERE user_id = ?'
    ).bind(user.sub).first() as any

    if (!wedding) {
      return c.json({ error: '웨딩 정보를 먼저 등록해주세요.' }, 404)
    }

    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: '파일을 선택해주세요.' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: '커버 이미지는 JPG, PNG 형식만 지원합니다.' }, 400)
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: '커버 이미지는 10MB를 초과할 수 없습니다.' }, 400)
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const fileKey = `covers/${wedding.id}/cover.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    if (c.env.R2) {
      await c.env.R2.put(fileKey, arrayBuffer, {
        httpMetadata: { contentType: file.type }
      })
    }

    // 커버 이미지 URL은 API를 통해 제공
    const coverUrl = `/api/uploads/cover-image/${wedding.id}`

    await c.env.DB.prepare(
      'UPDATE weddings SET cover_image_key = ?, cover_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(fileKey, coverUrl, wedding.id).run()

    return c.json({
      success: true,
      cover_image_url: coverUrl,
      message: '커버 이미지가 업로드되었습니다.'
    })
  } catch (error) {
  console.error('COVER UPLOAD ERROR:', error)
  return c.json({ error: String(error) }, 500)
}
})

// 커버 이미지 조회 (공개)
uploads.get('/cover-image/:weddingId', async (c) => {
  try {
    const weddingId = c.req.param('weddingId')

    const wedding = await c.env.DB.prepare(
      'SELECT cover_image_key FROM weddings WHERE id = ?'
    ).bind(weddingId).first() as any

    if (!wedding?.cover_image_key) {
      return c.notFound()
    }

    if (!c.env.R2) {
      return c.notFound()
    }

    const object = await c.env.R2.get(wedding.cover_image_key)
    if (!object) {
      return c.notFound()
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=86400')

    return new Response(object.body, { headers })
  } catch (error) {
    return c.notFound()
  }
})

export default uploads

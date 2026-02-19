// 인증 라우트 (회원가입, 로그인, 로그아웃)
import { Hono } from 'hono'
import { signToken, hashPassword, verifyPassword } from '../lib/auth'
import { generateId, validateEmail } from '../lib/utils'
import type { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

// 회원가입
auth.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()

    if (!email || !password || !name) {
      return c.json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' }, 400)
    }

    if (!validateEmail(email)) {
      return c.json({ error: '유효한 이메일 주소를 입력해주세요.' }, 400)
    }

    if (password.length < 8) {
      return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
    }

    // 이메일 중복 확인
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existing) {
      return c.json({ error: '이미 사용 중인 이메일입니다.' }, 409)
    }

    const id = generateId()
    const passwordHash = await hashPassword(password)

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email, passwordHash, name, 'admin').run()

    const secret = c.env.JWT_SECRET || 'wedding_memory_secret_key_2024'
    const token = await signToken(
      { sub: id, email, name, role: 'admin' },
      secret
    )

    return c.json({
      success: true,
      token,
      user: { id, email, name, role: 'admin' }
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ error: '회원가입 중 오류가 발생했습니다.' }, 500)
  }
})

// 로그인
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as any

    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
    }

    // 슈퍼어드민 플레이스홀더 처리
    if (user.password_hash === '$superadmin_placeholder$') {
      const defaultHash = await hashPassword('Admin@1234!')
      if (await verifyPassword(password, defaultHash)) {
        // 실제 해시로 업데이트
        await c.env.DB.prepare(
          'UPDATE users SET password_hash = ? WHERE id = ?'
        ).bind(defaultHash, user.id).run()
      } else {
        return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
      }
    } else {
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
      }
    }

    const secret = c.env.JWT_SECRET || 'wedding_memory_secret_key_2024'
    const token = await signToken(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      secret
    )

    return c.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: '로그인 중 오류가 발생했습니다.' }, 500)
  }
})

// 비밀번호 재설정 (이메일 발송 없이 임시 구현)
auth.post('/reset-password', async (c) => {
  try {
    const { email, newPassword, confirmPassword } = await c.req.json()

    if (!email || !newPassword || !confirmPassword) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400)
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: '비밀번호가 일치하지 않습니다.' }, 400)
    }

    if (newPassword.length < 8) {
      return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
    }

    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      // 보안상 존재 여부 노출 안함
      return c.json({ success: true, message: '비밀번호가 재설정되었습니다.' })
    }

    const passwordHash = await hashPassword(newPassword)
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?'
    ).bind(passwordHash, email).run()

    return c.json({ success: true, message: '비밀번호가 재설정되었습니다.' })
  } catch (error) {
    return c.json({ error: '비밀번호 재설정 중 오류가 발생했습니다.' }, 500)
  }
})

export default auth

// 인증 미들웨어
import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../lib/auth'
import type { Bindings, JWTPayload } from '../types'

type Variables = {
  user: JWTPayload
}

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const cookieToken = getCookieValue(c.req.header('cookie') || '', 'auth_token')
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : cookieToken

    if (!token) {
      // API 요청인지 확인
      if (c.req.path.startsWith('/api/')) {
        return c.json({ error: '인증이 필요합니다.' }, 401)
      }
      return c.redirect('/login')
    }

    const secret = c.env.JWT_SECRET || 'wedding_memory_secret_key_2024'
    const payload = await verifyToken(token, secret)
    
    if (!payload) {
      if (c.req.path.startsWith('/api/')) {
        return c.json({ error: '유효하지 않은 토큰입니다.' }, 401)
      }
      return c.redirect('/login')
    }

    c.set('user', payload)
    await next()
  }
)

export const superAdminMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user')
    if (!user || user.role !== 'superadmin') {
      return c.json({ error: '슈퍼어드민 권한이 필요합니다.' }, 403)
    }
    await next()
  }
)

function getCookieValue(cookieStr: string, name: string): string | null {
  const cookies = cookieStr.split(';')
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) return decodeURIComponent(value || '')
  }
  return null
}

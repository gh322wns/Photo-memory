// JWT 인증 유틸리티
import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from '../types'

const getSecret = (secret: string) => new TextEncoder().encode(secret)

export async function signToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret(secret))
  return jwt
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret))
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// 간단한 비밀번호 해시 (Web Crypto API 사용 - Cloudflare Workers 호환)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'wedding_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

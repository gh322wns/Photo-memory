// 타입 정의

export type UserRole = 'admin' | 'superadmin'
export type PlanId = 'plan_a' | 'plan_b' | 'plan_c'
export type FileType = 'photo' | 'video'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Plan {
  id: PlanId
  name: string
  duration_days: number | null
  description: string
  is_active: number
}

export interface Wedding {
  id: string
  user_id: string
  bride_name: string
  groom_name: string
  wedding_date: string
  venue_name?: string
  wedding_time?: string
  contact_email: string
  plan_id: PlanId
  cover_image_key?: string
  cover_image_url?: string
  is_active: number
  upload_disabled: number
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface Upload {
  id: string
  wedding_id: string
  guest_name: string
  file_key: string
  file_name: string
  file_type: FileType
  file_size: number
  mime_type: string
  thumbnail_key?: string
  device_type?: string
  upload_at: string
}

export interface Guest {
  id: string
  wedding_id: string
  name: string
  device_type?: string
  visited_at: string
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  iat: number
  exp: number
}

export type Bindings = {
  DB: D1Database
  R2: R2Bucket
  JWT_SECRET: string
}

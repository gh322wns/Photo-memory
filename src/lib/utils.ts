// UUID 생성 유틸리티 (Cloudflare Workers 호환)
export function generateId(): string {
  return crypto.randomUUID()
}

// 날짜 포맷 유틸리티
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 플랜 만료일 계산
export function calculateExpiryDate(weddingDate: string, durationDays: number | null): string | null {
  if (durationDays === null) return null // 영구 보관
  const date = new Date(weddingDate)
  date.setDate(date.getDate() + durationDays)
  return date.toISOString()
}

// 만료 여부 확인
export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false // 영구 보관
  return new Date() > new Date(expiresAt)
}

// 파일 크기 포맷
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// 게스트 이름 유효성 검사
export function validateGuestName(name: string): boolean {
  if (!name || name.trim().length === 0) return false
  if (name.length > 20) return false
  // 특수문자 제외 (한글, 영문, 숫자, 공백만 허용)
  const pattern = /^[가-힣a-zA-Z0-9\s]+$/
  return pattern.test(name.trim())
}

// 이메일 유효성 검사
export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

// 파일 타입 판별
export function getFileType(mimeType: string): 'photo' | 'video' | null {
  if (['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'].includes(mimeType)) {
    return 'photo'
  }
  if (['video/mp4', 'video/quicktime', 'video/mov'].includes(mimeType)) {
    return 'video'
  }
  return null
}

// 남은 일수 계산
export function getDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

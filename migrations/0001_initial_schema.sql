-- 웨딩 메모리 플랫폼 데이터베이스 스키마

-- 사용자 테이블 (신랑/신부 어드민)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin' | 'superadmin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 플랜 테이블
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER, -- NULL = 영구 (Lifetime)
  description TEXT,
  is_active INTEGER DEFAULT 1
);

-- 플랜 기본 데이터 삽입
INSERT OR IGNORE INTO plans (id, name, duration_days, description) VALUES
  ('plan_a', '3일 플랜', 3, '웨딩 날짜 기준 3일간 파일 다운로드 가능'),
  ('plan_b', '7일 플랜', 7, '웨딩 날짜 기준 7일간 파일 다운로드 가능'),
  ('plan_c', '평생 보관', NULL, '영구 저장 및 무제한 다운로드');

-- 웨딩 테이블
CREATE TABLE IF NOT EXISTS weddings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  wedding_date TEXT NOT NULL,
  venue_name TEXT,
  wedding_time TEXT,
  contact_email TEXT NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'plan_a',
  cover_image_key TEXT,
  cover_image_url TEXT,
  is_active INTEGER DEFAULT 1,
  upload_disabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 업로드 파일 테이블
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  wedding_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'photo' | 'video'
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  thumbnail_key TEXT,
  device_type TEXT,
  upload_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id)
);

-- 게스트 정보 테이블
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  wedding_id TEXT NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT,
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weddings_user_id ON weddings(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_wedding_id ON uploads(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 슈퍼어드민 계정 생성 (비밀번호: Admin@1234! - 실제 배포시 변경 필요)
-- 해시값은 애플리케이션에서 생성
INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES
  ('superadmin-001', 'admin@wedding-memory.com', '$superadmin_placeholder$', '슈퍼어드민', 'superadmin');

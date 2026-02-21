import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import auth from './routes/auth'
import weddings from './routes/weddings'
import uploads from './routes/uploads'
import superAdmin from './routes/superadmin'
import type { Bindings } from './types'
import { isExpired, getDaysRemaining } from './lib/utils'

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Guest-Name'],
}))

// Static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', auth)
app.route('/api/weddings', weddings)
app.route('/api/uploads', uploads)
app.route('/api/super', superAdmin)

// ─── 페이지 라우트 ──────────────────────────────────────────

// 메인 (랜딩) 페이지
app.get('/', (c) => {
  return c.html(landingPage())
})

// 로그인 페이지
app.get('/login', (c) => {
  return c.html(loginPage())
})

// 회원가입 페이지
app.get('/register', (c) => {
  return c.html(registerPage())
})

// 비밀번호 재설정
app.get('/reset-password', (c) => {
  return c.html(resetPasswordPage())
})

// 어드민 대시보드
app.get('/dashboard', (c) => {
  return c.html(dashboardPage())
})

// 웨딩 정보 등록
app.get('/setup', (c) => {
  return c.html(setupPage())
})

// 슈퍼어드민 페이지
app.get('/super', (c) => {
  return c.html(superAdminPage())
})

// 게스트 웨딩 페이지 (QR 접근)
app.get('/wedding/:id', async (c) => {
  const id = c.req.param('id')
  return c.html(guestWeddingPage(id))
})

// ─── HTML 템플릿 함수들 ──────────────────────────────────────

function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>웨딩 메모리 - 소중한 순간을 함께</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .hero-bg { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); }
    .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    .btn-primary:hover { background: linear-gradient(135deg, #b890b8 0%, #d88888 100%); }
    .floating { animation: floating 3s ease-in-out infinite; }
    @keyframes floating { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  </style>
</head>
<body class="hero-bg min-h-screen">
  <!-- Navigation -->
  <nav class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-rose-100">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <span class="text-rose-400 text-xl">💍</span>
        <span class="serif text-lg font-semibold text-gray-700">웨딩 메모리</span>
      </a>
      <div class="flex gap-3">
        <a href="/login" class="px-4 py-2 text-sm text-gray-600 hover:text-rose-500 transition-colors">로그인</a>
        <a href="/register" class="px-4 py-2 text-sm text-white rounded-full btn-primary transition-all shadow-sm">시작하기</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-24 pb-16 px-4 text-center">
    <div class="max-w-4xl mx-auto">
      <div class="floating text-6xl mb-6">💍</div>
      <h1 class="serif text-4xl md:text-6xl font-light text-gray-700 mb-4 leading-tight">
        소중한 웨딩의 모든 순간을<br>
        <span class="text-rose-400">함께 간직하세요</span>
      </h1>
      <p class="text-gray-500 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
        QR 코드 하나로 하객들의 사진과 영상을 한 곳에 모아보세요.<br>
        로그인 없이 간편하게, 소중한 추억을 영원히.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/register" class="px-8 py-4 text-white rounded-full btn-primary text-lg font-medium shadow-lg shadow-rose-100 hover:shadow-xl transition-all">
          무료로 시작하기 →
        </a>
        <a href="#how-it-works" class="px-8 py-4 text-gray-600 rounded-full bg-white border border-gray-200 text-lg font-medium hover:bg-gray-50 transition-all">
          작동 방식 알아보기
        </a>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section id="how-it-works" class="py-16 px-4 bg-white">
    <div class="max-w-5xl mx-auto">
      <h2 class="serif text-3xl text-center text-gray-700 mb-12">어떻게 작동하나요?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center card-hover bg-rose-50 rounded-2xl p-6">
          <div class="text-4xl mb-4">📋</div>
          <h3 class="font-semibold text-gray-700 mb-2 text-lg">1. 웨딩 정보 등록</h3>
          <p class="text-gray-500 text-sm leading-relaxed">신랑신부 이름, 웨딩 날짜, 커버 이미지를 등록하고 플랜을 선택하세요.</p>
        </div>
        <div class="text-center card-hover bg-purple-50 rounded-2xl p-6">
          <div class="text-4xl mb-4">📱</div>
          <h3 class="font-semibold text-gray-700 mb-2 text-lg">2. QR 코드 공유</h3>
          <p class="text-gray-500 text-sm leading-relaxed">자동 생성된 QR 코드를 청첩장에 인쇄하거나 하객들에게 공유하세요.</p>
        </div>
        <div class="text-center card-hover bg-pink-50 rounded-2xl p-6">
          <div class="text-4xl mb-4">🎉</div>
          <h3 class="font-semibold text-gray-700 mb-2 text-lg">3. 추억 수집</h3>
          <p class="text-gray-500 text-sm leading-relaxed">하객들이 QR 스캔 후 이름 입력만으로 사진과 영상을 바로 업로드합니다.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Plans -->
  <section class="py-16 px-4">
    <div class="max-w-5xl mx-auto">
      <h2 class="serif text-3xl text-center text-gray-700 mb-4">요금제</h2>
      <p class="text-center text-gray-500 mb-10">현재 모든 플랜 무료 제공 중</p>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
          <div class="text-center mb-4">
            <span class="text-3xl">🌸</span>
            <h3 class="font-semibold text-gray-700 text-lg mt-2">3일 플랜</h3>
            <div class="text-3xl font-bold text-gray-800 mt-2">무료</div>
          </div>
          <ul class="text-sm text-gray-500 space-y-2">
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>웨딩일 기준 3일간 다운로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>무제한 게스트 업로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>QR 코드 생성</li>
          </ul>
        </div>
        <div class="bg-gradient-to-b from-rose-50 to-white rounded-2xl p-6 shadow-md border-2 border-rose-200 card-hover relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-400 text-white text-xs px-3 py-1 rounded-full">인기</div>
          <div class="text-center mb-4">
            <span class="text-3xl">🌹</span>
            <h3 class="font-semibold text-gray-700 text-lg mt-2">7일 플랜</h3>
            <div class="text-3xl font-bold text-gray-800 mt-2">무료</div>
          </div>
          <ul class="text-sm text-gray-500 space-y-2">
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>웨딩일 기준 7일간 다운로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>무제한 게스트 업로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>QR 코드 생성</li>
          </ul>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
          <div class="text-center mb-4">
            <span class="text-3xl">👑</span>
            <h3 class="font-semibold text-gray-700 text-lg mt-2">평생 보관</h3>
            <div class="text-3xl font-bold text-gray-800 mt-2">무료</div>
          </div>
          <ul class="text-sm text-gray-500 space-y-2">
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>영구 저장 및 다운로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>무제한 게스트 업로드</li>
            <li class="flex items-center gap-2"><i class="fas fa-check text-green-400"></i>QR 코드 생성</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-16 px-4 text-center bg-white">
    <h2 class="serif text-3xl text-gray-700 mb-4">지금 바로 시작하세요</h2>
    <p class="text-gray-500 mb-6">5분 안에 완성되는 웨딩 메모리 서비스</p>
    <a href="/register" class="inline-block px-8 py-4 text-white rounded-full btn-primary text-lg font-medium shadow-lg shadow-rose-100">
      무료로 시작하기 💍
    </a>
  </section>

  <!-- Footer -->
  <footer class="py-8 text-center text-gray-400 text-sm border-t border-gray-100">
    <p>© 2024 웨딩 메모리. 소중한 순간을 영원히.</p>
  </footer>
</body>
</html>`
}

function loginPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .bg-gradient { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    input:focus { outline: none; border-color: #c8a2c8; box-shadow: 0 0 0 3px rgba(200,162,200,0.15); }
  </style>
</head>
<body class="bg-gradient min-h-screen flex items-center justify-center px-4">
  <div class="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="text-4xl">💍</a>
      <h1 class="serif text-2xl font-light text-gray-700 mt-3">웨딩 메모리</h1>
      <p class="text-gray-400 text-sm mt-1">신랑신부 어드민 로그인</p>
    </div>

    <div id="alert" class="hidden mb-4 p-3 rounded-xl text-sm"></div>

    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">이메일</label>
        <input type="email" id="email" placeholder="이메일을 입력하세요"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">비밀번호</label>
        <div class="relative">
          <input type="password" id="password" placeholder="비밀번호를 입력하세요"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
          <button type="button" onclick="togglePw()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i class="fas fa-eye" id="eyeIcon"></i>
          </button>
        </div>
      </div>

      <button type="submit" class="w-full py-3.5 text-white rounded-xl btn-primary font-medium text-sm transition-all hover:opacity-90 active:scale-95 shadow-md shadow-rose-100">
        로그인
      </button>
    </form>

    <div class="mt-4 text-center space-y-2">
      <a href="/reset-password" class="text-sm text-gray-400 hover:text-rose-400 transition-colors">비밀번호를 잊으셨나요?</a>
      <p class="text-sm text-gray-400">계정이 없으신가요? <a href="/register" class="text-rose-400 hover:text-rose-500 font-medium">회원가입</a></p>
    </div>
  </div>

  <script>
    function togglePw() {
      const pw = document.getElementById('password')
      const icon = document.getElementById('eyeIcon')
      pw.type = pw.type === 'password' ? 'text' : 'password'
      icon.className = pw.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
    }
    function showAlert(msg, type='error') {
      const el = document.getElementById('alert')
      el.className = 'mb-4 p-3 rounded-xl text-sm ' + (type==='error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')
      el.textContent = msg
      el.classList.remove('hidden')
    }
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      if (!email || !password) { showAlert('이메일과 비밀번호를 입력해주세요.'); return }
      const btn = e.target.querySelector('button[type=submit]')
      btn.textContent = '로그인 중...'
      btn.disabled = true
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (data.success) {
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          showAlert('로그인 성공! 대시보드로 이동합니다.', 'success')
          setTimeout(() => {
            window.location.href = data.user.role === 'superadmin' ? '/super' : '/dashboard'
          }, 800)
        } else {
          showAlert(data.error || '로그인에 실패했습니다.')
          btn.textContent = '로그인'
          btn.disabled = false
        }
      } catch(err) {
        showAlert('오류가 발생했습니다. 다시 시도해주세요.')
        btn.textContent = '로그인'
        btn.disabled = false
      }
    })
  </script>
</body>
</html>`
}

function registerPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>회원가입 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .bg-gradient { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    input:focus { outline: none; border-color: #c8a2c8; box-shadow: 0 0 0 3px rgba(200,162,200,0.15); }
  </style>
</head>
<body class="bg-gradient min-h-screen flex items-center justify-center px-4 py-8">
  <div class="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="text-4xl">💍</a>
      <h1 class="serif text-2xl font-light text-gray-700 mt-3">웨딩 메모리</h1>
      <p class="text-gray-400 text-sm mt-1">새 계정을 만들어보세요</p>
    </div>

    <div id="alert" class="hidden mb-4 p-3 rounded-xl text-sm"></div>

    <form id="registerForm" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">이름</label>
        <input type="text" id="name" placeholder="이름을 입력하세요"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">이메일</label>
        <input type="email" id="email" placeholder="이메일을 입력하세요"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">비밀번호 <span class="text-gray-400 font-normal">(8자 이상)</span></label>
        <input type="password" id="password" placeholder="비밀번호를 입력하세요"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">비밀번호 확인</label>
        <input type="password" id="confirmPassword" placeholder="비밀번호를 다시 입력하세요"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>

      <button type="submit" class="w-full py-3.5 text-white rounded-xl btn-primary font-medium text-sm transition-all hover:opacity-90 active:scale-95 shadow-md shadow-rose-100">
        회원가입
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-400">
      이미 계정이 있으신가요? <a href="/login" class="text-rose-400 hover:text-rose-500 font-medium">로그인</a>
    </p>
  </div>

  <script>
    function showAlert(msg, type='error') {
      const el = document.getElementById('alert')
      el.className = 'mb-4 p-3 rounded-xl text-sm ' + (type==='error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')
      el.textContent = msg
      el.classList.remove('hidden')
    }
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = document.getElementById('name').value
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      const confirmPassword = document.getElementById('confirmPassword').value
      if (!name || !email || !password) { showAlert('모든 필드를 입력해주세요.'); return }
      if (password !== confirmPassword) { showAlert('비밀번호가 일치하지 않습니다.'); return }
      if (password.length < 8) { showAlert('비밀번호는 8자 이상이어야 합니다.'); return }
      const btn = e.target.querySelector('button[type=submit]')
      btn.textContent = '가입 중...'
      btn.disabled = true
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        const data = await res.json()
        if (data.success) {
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          showAlert('회원가입 완료! 웨딩 정보를 등록해주세요.', 'success')
          setTimeout(() => { window.location.href = '/setup' }, 1000)
        } else {
          showAlert(data.error || '회원가입에 실패했습니다.')
          btn.textContent = '회원가입'
          btn.disabled = false
        }
      } catch(err) {
        showAlert('오류가 발생했습니다. 다시 시도해주세요.')
        btn.textContent = '회원가입'
        btn.disabled = false
      }
    })
  </script>
</body>
</html>`
}

function resetPasswordPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>* { font-family: 'Noto Sans KR', sans-serif; } .bg-gradient { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); } .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); } input:focus { outline: none; border-color: #c8a2c8; box-shadow: 0 0 0 3px rgba(200,162,200,0.15); }</style>
</head>
<body class="bg-gradient min-h-screen flex items-center justify-center px-4">
  <div class="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="text-4xl mb-3">🔐</div>
      <h1 class="text-2xl font-semibold text-gray-700">비밀번호 재설정</h1>
      <p class="text-gray-400 text-sm mt-1">새 비밀번호를 설정해주세요</p>
    </div>
    <div id="alert" class="hidden mb-4 p-3 rounded-xl text-sm"></div>
    <form id="resetForm" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">이메일</label>
        <input type="email" id="email" placeholder="가입한 이메일" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">새 비밀번호</label>
        <input type="password" id="newPassword" placeholder="새 비밀번호 (8자 이상)" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1.5 font-medium">비밀번호 확인</label>
        <input type="password" id="confirmPassword" placeholder="비밀번호 확인" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <button type="submit" class="w-full py-3.5 text-white rounded-xl btn-primary font-medium text-sm shadow-md shadow-rose-100">비밀번호 재설정</button>
    </form>
    <p class="mt-4 text-center text-sm text-gray-400"><a href="/login" class="text-rose-400 hover:text-rose-500">로그인으로 돌아가기</a></p>
  </div>
  <script>
    function showAlert(msg,type='error'){const el=document.getElementById('alert');el.className='mb-4 p-3 rounded-xl text-sm '+(type==='error'?'bg-red-50 text-red-600 border border-red-200':'bg-green-50 text-green-600 border border-green-200');el.textContent=msg;el.classList.remove('hidden')}
    document.getElementById('resetForm').addEventListener('submit',async(e)=>{
      e.preventDefault()
      const email=document.getElementById('email').value,newPassword=document.getElementById('newPassword').value,confirmPassword=document.getElementById('confirmPassword').value
      if(!email||!newPassword){showAlert('모든 필드를 입력해주세요.');return}
      if(newPassword!==confirmPassword){showAlert('비밀번호가 일치하지 않습니다.');return}
      if(newPassword.length<8){showAlert('비밀번호는 8자 이상이어야 합니다.');return}
      try{
        const res=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,newPassword,confirmPassword})})
        const data=await res.json()
        showAlert(data.success?'비밀번호가 재설정되었습니다.':'오류: '+(data.error||'실패'),data.success?'success':'error')
        if(data.success)setTimeout(()=>{window.location.href='/login'},1500)
      }catch{showAlert('오류가 발생했습니다.')}
    })
  </script>
</body>
</html>`
}

function setupPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>웨딩 설정 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .bg-gradient { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    input:focus,select:focus { outline: none; border-color: #c8a2c8; box-shadow: 0 0 0 3px rgba(200,162,200,0.15); }
    .plan-card { cursor: pointer; transition: all 0.2s; }
    .plan-card.selected { border-color: #c8a2c8; background: #fdf6fd; }
    .step { display: none; }
    .step.active { display: block; }
    .upload-zone { border: 2px dashed #e2d5e2; transition: all 0.2s; }
    .upload-zone:hover, .upload-zone.dragging { border-color: #c8a2c8; background: #fdf6fd; }
  </style>
</head>
<body class="bg-gradient min-h-screen px-4 py-8">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <a href="/" class="text-3xl">💍</a>
      <h1 class="serif text-2xl font-light text-gray-700 mt-2">웨딩 정보 설정</h1>
    </div>

    <!-- Progress -->
    <div class="flex items-center justify-center mb-8 gap-2">
      <div class="step-dot flex items-center gap-2" data-step="1">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-rose-400 text-white" id="dot1">1</div>
        <span class="text-sm text-gray-500 hidden sm:block">플랜 선택</span>
      </div>
      <div class="w-8 h-px bg-gray-200"></div>
      <div class="step-dot flex items-center gap-2" data-step="2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500" id="dot2">2</div>
        <span class="text-sm text-gray-500 hidden sm:block">웨딩 정보</span>
      </div>
      <div class="w-8 h-px bg-gray-200"></div>
      <div class="step-dot flex items-center gap-2" data-step="3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500" id="dot3">3</div>
        <span class="text-sm text-gray-500 hidden sm:block">커버 이미지</span>
      </div>
      <div class="w-8 h-px bg-gray-200"></div>
      <div class="step-dot flex items-center gap-2" data-step="4">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500" id="dot4">4</div>
        <span class="text-sm text-gray-500 hidden sm:block">QR 생성</span>
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
      <div id="alert" class="hidden mb-4 p-3 rounded-xl text-sm"></div>

      <!-- Step 1: Plan -->
      <div id="step1" class="step active">
        <h2 class="text-xl font-semibold text-gray-700 mb-2">플랜을 선택해주세요</h2>
        <p class="text-gray-400 text-sm mb-6">현재 모든 플랜 무료 제공 중</p>
        <div class="space-y-3">
          <div class="plan-card border-2 border-gray-100 rounded-2xl p-4 selected" data-plan="plan_a" onclick="selectPlan('plan_a')">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌸</span>
                <div>
                  <div class="font-semibold text-gray-700">3일 플랜</div>
                  <div class="text-sm text-gray-400">웨딩일 기준 3일간 다운로드</div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 border-rose-400 flex items-center justify-center" id="check_plan_a">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
              </div>
            </div>
          </div>
          <div class="plan-card border-2 border-gray-100 rounded-2xl p-4" data-plan="plan_b" onclick="selectPlan('plan_b')">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌹</span>
                <div>
                  <div class="font-semibold text-gray-700">7일 플랜 <span class="text-xs bg-rose-100 text-rose-500 px-2 py-0.5 rounded-full ml-1">인기</span></div>
                  <div class="text-sm text-gray-400">웨딩일 기준 7일간 다운로드</div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center" id="check_plan_b">
                <div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>
              </div>
            </div>
          </div>
          <div class="plan-card border-2 border-gray-100 rounded-2xl p-4" data-plan="plan_c" onclick="selectPlan('plan_c')">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">👑</span>
                <div>
                  <div class="font-semibold text-gray-700">평생 보관</div>
                  <div class="text-sm text-gray-400">영구 저장 및 무제한 다운로드</div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center" id="check_plan_c">
                <div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        <button onclick="goStep(2)" class="w-full mt-6 py-3.5 text-white rounded-xl btn-primary font-medium shadow-md shadow-rose-100">다음 단계 →</button>
      </div>

      <!-- Step 2: Wedding Info -->
      <div id="step2" class="step">
        <h2 class="text-xl font-semibold text-gray-700 mb-6">웨딩 정보를 입력해주세요</h2>
        <form id="weddingForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1.5 font-medium">신부 이름 <span class="text-rose-400">*</span></label>
              <input type="text" id="bride_name" placeholder="신부 이름" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1.5 font-medium">신랑 이름 <span class="text-rose-400">*</span></label>
              <input type="text" id="groom_name" placeholder="신랑 이름" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1.5 font-medium">웨딩 날짜 <span class="text-rose-400">*</span></label>
            <input type="date" id="wedding_date" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1.5 font-medium">웨딩 장소</label>
            <input type="text" id="venue_name" placeholder="웨딩홀 이름 (선택)" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1.5 font-medium">예식 시작 시간</label>
            <input type="time" id="wedding_time" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1.5 font-medium">연락처 이메일 <span class="text-rose-400">*</span></label>
            <input type="email" id="contact_email" placeholder="연락받을 이메일" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="goStep(1)" class="w-1/3 py-3 text-gray-500 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">← 이전</button>
            <button type="submit" class="flex-1 py-3 text-white rounded-xl btn-primary text-sm font-medium shadow-md shadow-rose-100">저장하고 다음 →</button>
          </div>
        </form>
      </div>

      <!-- Step 3: Cover Image -->
      <div id="step3" class="step">
        <h2 class="text-xl font-semibold text-gray-700 mb-2">커버 이미지를 업로드해주세요</h2>
        <p class="text-gray-400 text-sm mb-6">하객에게 보여질 대표 이미지 (JPG/PNG, 최대 10MB)</p>
        <div id="coverDropZone" class="upload-zone rounded-2xl p-8 text-center cursor-pointer" onclick="document.getElementById('coverFile').click()">
          <div id="coverPreview" class="hidden">
            <img id="coverImg" class="max-h-48 mx-auto rounded-xl object-cover" alt="커버 미리보기">
            <p class="text-sm text-gray-400 mt-2" id="coverFileName"></p>
          </div>
          <div id="coverPlaceholder">
            <div class="text-4xl mb-3">📸</div>
            <p class="text-gray-500 font-medium">클릭하여 이미지 선택</p>
            <p class="text-gray-400 text-sm mt-1">또는 파일을 여기에 드래그하세요</p>
          </div>
        </div>
        <input type="file" id="coverFile" accept="image/jpeg,image/png,image/webp" class="hidden">
        <div id="uploadProgress" class="hidden mt-3">
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div class="bg-rose-400 h-1.5 rounded-full transition-all" id="progressBar" style="width:0%"></div>
          </div>
          <p class="text-xs text-gray-400 mt-1 text-center" id="progressText">업로드 중...</p>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="goStep(2)" class="w-1/3 py-3 text-gray-500 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">← 이전</button>
          <button id="uploadCoverBtn" onclick="uploadCover()" class="flex-1 py-3 text-white rounded-xl btn-primary text-sm font-medium shadow-md shadow-rose-100">업로드하고 다음 →</button>
        </div>
        <button onclick="goStep(4)" class="w-full mt-2 py-2 text-gray-400 text-sm hover:text-gray-600">건너뛰기</button>
      </div>

      <!-- Step 4: QR Code -->
      <div id="step4" class="step">
        <div class="text-center">
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">설정이 완료되었습니다!</h2>
          <p class="text-gray-400 text-sm mb-6">하객들과 QR 코드를 공유하세요</p>
          <div class="bg-gray-50 rounded-2xl p-6 mb-6">
            <div id="qrContainer" class="flex items-center justify-center">
              <canvas id="qrCanvas" class="rounded-xl"></canvas>
            </div>
            <p id="weddingUrl" class="text-xs text-gray-400 mt-3 break-all"></p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <button onclick="downloadQR()" class="flex-1 py-3 text-white rounded-xl btn-primary text-sm font-medium shadow-md shadow-rose-100">
              📥 QR 코드 다운로드
            </button>
            <button onclick="copyLink()" class="flex-1 py-3 text-gray-600 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">
              🔗 링크 복사
            </button>
          </div>
          <a href="/dashboard" class="block mt-4 py-3 text-rose-400 text-sm font-medium">대시보드로 이동 →</a>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    let selectedPlan = 'plan_a'
    let weddingId = null
    let weddingUrl = null

    // 인증 확인
    const token = localStorage.getItem('auth_token')
    if (!token) window.location.href = '/login'

    function getHeaders() {
      return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    }

    function showAlert(msg, type='error') {
      const el = document.getElementById('alert')
      el.className = 'mb-4 p-3 rounded-xl text-sm ' + (type==='error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')
      el.textContent = msg
      el.classList.remove('hidden')
    }

    function selectPlan(planId) {
      selectedPlan = planId
      document.querySelectorAll('.plan-card').forEach(card => {
        const cardPlan = card.dataset.plan
        card.classList.toggle('selected', cardPlan === planId)
        const inner = document.getElementById('check_' + cardPlan)
        if (inner) {
          inner.classList.toggle('border-rose-400', cardPlan === planId)
          inner.classList.toggle('border-gray-200', cardPlan !== planId)
          inner.querySelector('div').classList.toggle('bg-rose-400', cardPlan === planId)
          inner.querySelector('div').classList.toggle('bg-transparent', cardPlan !== planId)
        }
      })
    }

    function goStep(n) {
      document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
      document.getElementById('step' + n).classList.add('active')
      for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('dot' + i)
        dot.className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (i <= n ? 'bg-rose-400 text-white' : 'bg-gray-200 text-gray-500')
      }
      document.getElementById('alert').classList.add('hidden')
      if (n === 4 && weddingId) generateQR()
    }

    // Step 2: 웨딩 정보 저장
    document.getElementById('weddingForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = {
        bride_name: document.getElementById('bride_name').value,
        groom_name: document.getElementById('groom_name').value,
        wedding_date: document.getElementById('wedding_date').value,
        venue_name: document.getElementById('venue_name').value,
        wedding_time: document.getElementById('wedding_time').value,
        contact_email: document.getElementById('contact_email').value,
        plan_id: selectedPlan
      }
      if (!body.bride_name || !body.groom_name || !body.wedding_date || !body.contact_email) {
        showAlert('필수 항목을 모두 입력해주세요.')
        return
      }
      const btn = e.target.querySelector('button[type=submit]')
      btn.textContent = '저장 중...'
      btn.disabled = true
      try {
        const res = await fetch('/api/weddings', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) })
        const data = await res.json()
        if (data.success) {
          weddingId = data.wedding.id
          goStep(3)
        } else {
          showAlert(data.error || '저장에 실패했습니다.')
        }
      } catch { showAlert('오류가 발생했습니다.') }
      btn.textContent = '저장하고 다음 →'
      btn.disabled = false
    })

    // Step 3: 커버 이미지
    document.getElementById('coverFile').addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        document.getElementById('coverImg').src = ev.target.result
        document.getElementById('coverFileName').textContent = file.name
        document.getElementById('coverPreview').classList.remove('hidden')
        document.getElementById('coverPlaceholder').classList.add('hidden')
      }
      reader.readAsDataURL(file)
    })

    async function uploadCover() {
      const file = document.getElementById('coverFile').files[0]
      if (!file) { goStep(4); return }
      if (!weddingId) { showAlert('웨딩 정보를 먼저 저장해주세요.'); return }
      const btn = document.getElementById('uploadCoverBtn')
      btn.textContent = '업로드 중...'
      btn.disabled = true
      document.getElementById('uploadProgress').classList.remove('hidden')
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/uploads/cover', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          document.getElementById('progressBar').style.width = '100%'
          document.getElementById('progressText').textContent = '업로드 완료!'
          setTimeout(() => goStep(4), 500)
        } else {
          showAlert(data.error || '업로드에 실패했습니다.')
        }
      } catch { showAlert('오류가 발생했습니다.') }
      btn.textContent = '업로드하고 다음 →'
      btn.disabled = false
    }

    function generateQR() {
      if (!weddingId) return
      weddingUrl = window.location.origin + '/wedding/' + weddingId
      document.getElementById('weddingUrl').textContent = weddingUrl
      QRCode.toCanvas(document.getElementById('qrCanvas'), weddingUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#333333', light: '#ffffff' }
      })
    }

    function downloadQR() {
      const canvas = document.getElementById('qrCanvas')
      const link = document.createElement('a')
      link.download = '웨딩QR코드.png'
      link.href = canvas.toDataURL()
      link.click()
    }

    function copyLink() {
      if (weddingUrl) {
        navigator.clipboard.writeText(weddingUrl).then(() => {
          showAlert('링크가 복사되었습니다!', 'success')
        })
      }
    }

    // 드래그 앤 드롭
    const dropZone = document.getElementById('coverDropZone')
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging') })
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'))
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('dragging')
      const files = e.dataTransfer.files
      if (files[0]) {
        document.getElementById('coverFile').files = files
        document.getElementById('coverFile').dispatchEvent(new Event('change'))
      }
    })

    // 기존 웨딩 정보 불러오기
    async function loadExistingWedding() {
      try {
        const res = await fetch('/api/weddings/my', { headers: { 'Authorization': 'Bearer ' + token } })
        const data = await res.json()
        if (data.wedding) {
          weddingId = data.wedding.id
          selectedPlan = data.wedding.plan_id || 'plan_a'
          selectPlan(selectedPlan)
          document.getElementById('bride_name').value = data.wedding.bride_name || ''
          document.getElementById('groom_name').value = data.wedding.groom_name || ''
          document.getElementById('wedding_date').value = data.wedding.wedding_date || ''
          document.getElementById('venue_name').value = data.wedding.venue_name || ''
          document.getElementById('wedding_time').value = data.wedding.wedding_time || ''
          document.getElementById('contact_email').value = data.wedding.contact_email || ''
        }
      } catch {}
    }
    loadExistingWedding()
  </script>
</body>
</html>`
}

function dashboardPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>대시보드 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    .sidebar { background: linear-gradient(180deg, #fdf6f0 0%, #fce8e8 100%); }
    .tab-btn.active { background: white; color: #e8a0a0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .file-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Top Nav -->
  <nav class="bg-white border-b border-gray-100 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <span class="text-xl">💍</span>
        <span class="serif text-lg font-semibold text-gray-700 hidden sm:block">웨딩 메모리</span>
      </a>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500" id="userName"></span>
        <button onclick="logout()" class="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <i class="fas fa-sign-out-alt"></i>
          <span class="hidden sm:inline ml-1">로그아웃</span>
        </button>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Loading State -->
    <div id="loadingState" class="text-center py-20">
      <div class="text-4xl mb-4 animate-spin inline-block">⏳</div>
      <p class="text-gray-400">불러오는 중...</p>
    </div>

    <!-- No Wedding State -->
    <div id="noWeddingState" class="hidden text-center py-20">
      <div class="text-6xl mb-4">💍</div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">웨딩 정보를 먼저 등록해주세요</h2>
      <p class="text-gray-400 mb-6">QR 코드를 생성하고 하객들과 추억을 공유하세요</p>
      <a href="/setup" class="inline-block px-6 py-3 text-white rounded-xl btn-primary shadow-md shadow-rose-100">웨딩 설정 시작하기 →</a>
    </div>

    <!-- Main Dashboard -->
    <div id="mainDashboard" class="hidden">
      <!-- Wedding Header -->
      <div class="bg-white rounded-2xl p-6 mb-6 shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-40 h-40 opacity-5 text-rose-400" style="font-size:10rem">💍</div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div id="coverThumb" class="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span class="text-3xl">💍</span>
          </div>
          <div class="flex-1">
            <h1 class="serif text-2xl text-gray-700" id="coupleNames"></h1>
            <p class="text-gray-400 text-sm mt-1" id="weddingInfo"></p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-500 font-medium" id="planBadge"></span>
              <span class="text-xs px-3 py-1 rounded-full" id="statusBadge"></span>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="showQRModal()" class="px-4 py-2 text-sm text-white rounded-xl btn-primary shadow-sm">
              <i class="fas fa-qrcode mr-1"></i>QR 코드
            </button>
            <a href="/setup" class="px-4 py-2 text-sm text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50">
              <i class="fas fa-edit mr-1"></i>편집
            </a>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div class="text-3xl font-bold text-rose-400" id="totalCount">0</div>
          <div class="text-xs text-gray-400 mt-1">전체 파일</div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div class="text-3xl font-bold text-purple-400" id="photoCount">0</div>
          <div class="text-xs text-gray-400 mt-1">사진</div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div class="text-3xl font-bold text-blue-400" id="videoCount">0</div>
          <div class="text-xs text-gray-400 mt-1">동영상</div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div class="text-3xl font-bold text-green-400" id="totalSize">0</div>
          <div class="text-xs text-gray-400 mt-1">저장 용량</div>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="bg-white rounded-2xl p-4 mb-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div class="flex gap-2">
          <button onclick="setFilter('all')" class="tab-btn active px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 transition-all" id="tab-all">전체</button>
          <button onclick="setFilter('photo')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 transition-all" id="tab-photo">사진</button>
          <button onclick="setFilter('video')" class="tab-btn px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 transition-all" id="tab-video">동영상</button>
        </div>
        <div class="flex gap-2">
          <button onclick="toggleUpload()" id="toggleBtn" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            <i class="fas fa-toggle-on mr-1"></i><span id="toggleText">업로드 비활성화</span>
          </button>
        </div>
      </div>

      <!-- Files Grid -->
      <div id="fileGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"></div>
      <div id="noFiles" class="hidden text-center py-16">
        <div class="text-5xl mb-3">📸</div>
        <p class="text-gray-400">아직 업로드된 파일이 없습니다</p>
        <p class="text-gray-300 text-sm mt-1">QR 코드를 공유하여 하객들의 사진을 모아보세요</p>
      </div>
      <div id="loadMoreBtn" class="hidden text-center mt-6">
        <button onclick="loadMore()" class="px-6 py-2 text-gray-500 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">더 보기</button>
      </div>
    </div>
  </div>

  <!-- QR Modal -->
  <div id="qrModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">QR 코드</h3>
      <p class="text-sm text-gray-400 mb-4">하객들과 공유하세요</p>
      <canvas id="modalQR" class="mx-auto rounded-xl mb-4"></canvas>
      <p id="modalUrl" class="text-xs text-gray-400 break-all mb-4"></p>
      <div class="flex gap-3">
        <button onclick="downloadQR()" class="flex-1 py-2.5 text-white rounded-xl btn-primary text-sm font-medium">📥 다운로드</button>
        <button onclick="copyLink()" class="flex-1 py-2.5 text-gray-600 rounded-xl border border-gray-200 text-sm font-medium">🔗 복사</button>
      </div>
      <button onclick="closeQRModal()" class="mt-3 text-sm text-gray-400 hover:text-gray-600">닫기</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    const token = localStorage.getItem('auth_token')
    if (!token) window.location.href = '/login'
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    document.getElementById('userName').textContent = user.name || ''

    let wedding = null, allUploads = [], currentFilter = 'all', uploadDisabled = false
    let page = 1, hasMore = false

    function getHeaders() {
      return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    }

    function formatSize(bytes) {
      if (!bytes) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
      if (bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(1) + ' MB'
      return (bytes/(1024*1024*1024)).toFixed(1) + ' GB'
    }

    function formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric'})
    }

    async function loadDashboard() {
      try {
        const res = await fetch('/api/weddings/my', { headers: getHeaders() })
        const data = await res.json()
        document.getElementById('loadingState').classList.add('hidden')
        if (!data.wedding) {
          document.getElementById('noWeddingState').classList.remove('hidden')
          return
        }
        wedding = data.wedding
        uploadDisabled = !!wedding.upload_disabled
        document.getElementById('mainDashboard').classList.remove('hidden')

        // 커플 정보
        document.getElementById('coupleNames').textContent = wedding.bride_name + ' ♥ ' + wedding.groom_name
        document.getElementById('weddingInfo').textContent =
          formatDate(wedding.wedding_date) + (wedding.venue_name ? ' · ' + wedding.venue_name : '') +
          (wedding.wedding_time ? ' · ' + wedding.wedding_time : '')

        // 플랜 배지
        const planNames = {plan_a:'🌸 3일 플랜', plan_b:'🌹 7일 플랜', plan_c:'👑 평생 보관'}
        document.getElementById('planBadge').textContent = planNames[wedding.plan_id] || wedding.plan_id

        // 상태 배지
        const statusEl = document.getElementById('statusBadge')
        if (wedding.upload_disabled) {
          statusEl.textContent = '업로드 비활성화'
          statusEl.className = 'text-xs px-3 py-1 rounded-full bg-red-50 text-red-400'
        } else {
          statusEl.textContent = '업로드 활성화'
          statusEl.className = 'text-xs px-3 py-1 rounded-full bg-green-50 text-green-400'
        }

     // 커버 이미지 (안전 버전)
const coverThumb = document.getElementById('coverThumb')

if (coverThumb) {
  coverThumb.innerHTML = '<span class="text-3xl">💍</span>'

  if (wedding.cover_image_url) {
    coverThumb.innerHTML = ''
    const img = document.createElement('img')
    img.src = wedding.cover_image_url
    img.className = 'w-full h-full object-cover rounded-2xl'
    img.loading = 'lazy'
    img.onerror = () => { coverThumb.innerHTML = '<span class="text-3xl">💍</span>' }
    coverThumb.appendChild(img)
  }
}

        // 통계
        const stats = data.stats || {}
        document.getElementById('totalCount').textContent = stats.total_count || 0
        document.getElementById('photoCount').textContent = stats.photo_count || 0
        document.getElementById('videoCount').textContent = stats.video_count || 0
        document.getElementById('totalSize').textContent = formatSize(stats.total_size || 0)

        // 업로드 토글 버튼
        updateToggleBtn()

        // 파일 목록
        await loadFiles()
      } catch(e) {
        console.error(e)
        document.getElementById('loadingState').innerHTML = '<p class="text-red-400">오류가 발생했습니다. 새로고침해주세요.</p>'
      }
    }

    function updateToggleBtn() {
      const btn = document.getElementById('toggleBtn')
      const text = document.getElementById('toggleText')
      if (uploadDisabled) {
        btn.className = 'px-3 py-1.5 text-sm rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-all'
        text.textContent = '업로드 활성화'
        btn.querySelector('i').className = 'fas fa-toggle-off mr-1'
      } else {
        btn.className = 'px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all'
        text.textContent = '업로드 비활성화'
        btn.querySelector('i').className = 'fas fa-toggle-on mr-1'
      }
    }

    async function loadFiles() {
      if (!wedding) return
      try {
        const res = await fetch('/api/uploads/my?page=' + page + '&limit=20', { headers: getHeaders() })
        const data = await res.json()
        if (page === 1) allUploads = data.uploads || []
        else allUploads = [...allUploads, ...(data.uploads || [])]
        hasMore = allUploads.length < (data.total || 0)
        document.getElementById('loadMoreBtn').classList.toggle('hidden', !hasMore)
        renderFiles()
      } catch(e) { console.error(e) }
    }

    function renderFiles() {
      const filtered = currentFilter === 'all' ? allUploads : allUploads.filter(u => u.file_type === currentFilter)
      const grid = document.getElementById('fileGrid')
      document.getElementById('noFiles').classList.toggle('hidden', filtered.length > 0)
      grid.innerHTML = filtered.map(u => \`
        <div class="file-card bg-white rounded-2xl overflow-hidden shadow-sm transition-all cursor-pointer" onclick="confirmDelete('\${u.id}', '\${u.file_name}')">
          <div class="aspect-square bg-gray-50 flex items-center justify-center relative">
            \${u.file_type === 'photo' ? '<div class="text-4xl">📸</div>' : '<div class="text-4xl">🎬</div>'}
            <span class="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-md">\${u.file_type === 'photo' ? '사진' : '영상'}</span>
          </div>
          <div class="p-2">
            <p class="text-xs text-gray-600 font-medium truncate">\${u.guest_name}</p>
            <p class="text-xs text-gray-300 truncate">\${formatSize(u.file_size)}</p>
          </div>
        </div>
      \`).join('')
    }

    function setFilter(f) {
      currentFilter = f
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      document.getElementById('tab-' + f).classList.add('active')
      renderFiles()
    }

    async function toggleUpload() {
      try {
        const res = await fetch('/api/weddings/toggle-upload', { method: 'PUT', headers: getHeaders() })
        const data = await res.json()
        if (data.success) {
          uploadDisabled = data.upload_disabled
          updateToggleBtn()
          const statusEl = document.getElementById('statusBadge')
          if (uploadDisabled) {
            statusEl.textContent = '업로드 비활성화'
            statusEl.className = 'text-xs px-3 py-1 rounded-full bg-red-50 text-red-400'
          } else {
            statusEl.textContent = '업로드 활성화'
            statusEl.className = 'text-xs px-3 py-1 rounded-full bg-green-50 text-green-400'
          }
        }
      } catch(e) { console.error(e) }
    }

    async function confirmDelete(id, name) {
      if (!confirm(name + '\\n\\n이 파일을 삭제하시겠습니까?')) return
      try {
        const res = await fetch('/api/uploads/' + id, { method: 'DELETE', headers: getHeaders() })
        const data = await res.json()
        if (data.success) {
          allUploads = allUploads.filter(u => u.id !== id)
          renderFiles()
          const total = parseInt(document.getElementById('totalCount').textContent) - 1
          document.getElementById('totalCount').textContent = Math.max(0, total)
        }
      } catch(e) { console.error(e) }
    }

    async function downloadFile(id) {
      window.open('/api/uploads/download/' + id + '?token=' + token, '_blank')
    }

    async function loadMore() {
      page++
      await loadFiles()
    }

    // QR 모달
    function showQRModal() {
      if (!wedding) return
      const url = window.location.origin + '/wedding/' + wedding.id
      document.getElementById('modalUrl').textContent = url
      QRCode.toCanvas(document.getElementById('modalQR'), url, { width: 200, margin: 2, color: { dark: '#333333', light: '#ffffff' } })
      document.getElementById('qrModal').classList.remove('hidden')
    }

    function closeQRModal() {
      document.getElementById('qrModal').classList.add('hidden')
    }

    function downloadQR() {
      const canvas = document.getElementById('modalQR')
      const link = document.createElement('a')
      link.download = '웨딩QR코드.png'
      link.href = canvas.toDataURL()
      link.click()
    }

    function copyLink() {
      if (!wedding) return
      const url = window.location.origin + '/wedding/' + wedding.id
      navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다!'))
    }

    function logout() {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    document.getElementById('qrModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('qrModal')) closeQRModal()
    })

    loadDashboard()
  </script>
</body>
</html>`
}

function guestWeddingPage(weddingId: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .serif { font-family: 'Noto Serif KR', serif; }
    .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); }
    .hero-cover { background: linear-gradient(135deg, #fdf6f0 0%, #fce8e8 50%, #f0e8f8 100%); }
    .step { display: none; }
    .step.active { display: block; }
    input:focus { outline: none; border-color: #c8a2c8; box-shadow: 0 0 0 3px rgba(200,162,200,0.15); }
    .upload-zone { border: 2px dashed #e2d5e2; transition: all 0.2s; }
    .upload-zone.dragging { border-color: #c8a2c8; background: #fdf6fd; }
    .file-item { background: white; border: 1px solid #f0e0e0; }
    @keyframes confetti { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
    .confetti { position: fixed; width: 8px; height: 8px; border-radius: 50%; animation: confetti 2.5s ease-in forwards; pointer-events: none; z-index: 100; }
  </style>
</head>
<body class="bg-white min-h-screen">

  <!-- Loading -->
  <div id="loadingScreen" class="min-h-screen flex items-center justify-center hero-cover">
    <div class="text-center">
      <div class="text-5xl mb-4 animate-pulse">💍</div>
      <p class="text-gray-400">불러오는 중...</p>
    </div>
  </div>

  <!-- Error Screen -->
  <div id="errorScreen" class="hidden min-h-screen flex items-center justify-center hero-cover">
    <div class="text-center px-4">
      <div class="text-5xl mb-4">😔</div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2" id="errorTitle">오류가 발생했습니다</h2>
      <p class="text-gray-400" id="errorMsg"></p>
    </div>
  </div>

  <!-- Main Content -->
  <div id="mainContent" class="hidden">

    <!-- Step 1: Landing -->
    <div id="step1" class="step active">
      <div class="hero-cover min-h-screen flex flex-col">
        <!-- Cover Image -->
        <div class="relative w-full" style="padding-top: 60%; max-height: 60vh;">
          <div class="absolute inset-0" id="coverSection">
            <div class="w-full h-full bg-gradient-to-b from-rose-100 to-purple-100 flex items-center justify-center" id="coverFallback">
              <div class="text-8xl opacity-30">💍</div>
            </div>
          </div>
        </div>

        <!-- Couple Info -->
        <div class="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
          <p class="text-rose-300 text-sm font-medium mb-2 tracking-widest">WEDDING MEMORY</p>
          <h1 class="serif text-4xl md:text-5xl text-gray-700 mb-2" id="coupleNames"></h1>
          <p class="text-gray-400 text-base mb-1" id="weddingDate"></p>
          <p class="text-gray-400 text-sm mb-8" id="venueName"></p>

          <p class="text-gray-500 text-base mb-6 max-w-xs">
            이 특별한 순간을 함께 담아주세요 🥹<br>
            <span class="text-sm text-gray-400">사진과 영상을 업로드해주시면<br>소중한 추억으로 간직하겠습니다.</span>
          </p>

          <button onclick="goToStep2()" class="w-full max-w-xs px-8 py-4 text-white rounded-full btn-primary text-lg font-medium shadow-lg shadow-rose-100 active:scale-95 transition-transform">
            📸 사진 · 영상 올리기
          </button>
          <p class="text-xs text-gray-300 mt-4">로그인 없이 간편하게 업로드</p>
        </div>
      </div>
    </div>

    <!-- Step 2: Name Input -->
    <div id="step2" class="step">
      <div class="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-white">
        <div class="w-full max-w-sm">
          <div class="text-center mb-8">
            <div class="text-5xl mb-4">👋</div>
            <h2 class="text-2xl font-semibold text-gray-700 mb-2">성함을 알려주세요</h2>
            <p class="text-gray-400 text-sm">어떻게 불러드릴까요?</p>
          </div>
          <div id="nameAlert" class="hidden mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200"></div>
          <div class="space-y-4">
            <div>
              <input type="text" id="guestName" maxlength="20" placeholder="이름 입력 (최대 20자)"
                class="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-center text-lg transition-all"
                onkeyup="checkName()" onkeydown="if(event.key==='Enter')goToStep3()">
              <p class="text-xs text-gray-300 text-center mt-2">한글, 영문, 숫자만 입력 가능합니다</p>
            </div>
            <button onclick="goToStep3()" id="nameNextBtn" class="w-full py-4 text-white rounded-2xl btn-primary text-lg font-medium shadow-md shadow-rose-100 opacity-50 transition-all">
              다음 →
            </button>
          </div>
          <button onclick="goToStep1()" class="w-full mt-4 text-gray-400 text-sm">← 돌아가기</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Upload -->
    <div id="step3" class="step">
      <div class="min-h-screen flex flex-col px-4 py-6">
        <div class="max-w-lg mx-auto w-full flex-1 flex flex-col">
          <div class="text-center mb-6">
            <div class="text-3xl mb-2">📸</div>
            <h2 class="text-xl font-semibold text-gray-700">사진 · 영상 업로드</h2>
            <p class="text-gray-400 text-sm mt-1"><span id="guestNameDisplay"></span>님의 소중한 순간을 공유해주세요</p>
          </div>

          <!-- Upload Zone -->
          <div id="uploadZone" class="upload-zone rounded-2xl p-8 text-center cursor-pointer mb-4 flex-1 flex flex-col items-center justify-center min-h-40"
               onclick="document.getElementById('fileInput').click()">
            <div class="text-5xl mb-3">📁</div>
            <p class="text-gray-500 font-medium text-base">클릭하여 파일 선택</p>
            <p class="text-gray-400 text-sm mt-1">또는 파일을 드래그하세요</p>
            <p class="text-gray-300 text-xs mt-2">JPG, PNG, HEIC, MP4, MOV · 최대 500MB/개</p>
          </div>

          <input type="file" id="fileInput" multiple accept="image/jpeg,image/png,image/heic,image/heif,image/webp,video/mp4,video/quicktime" class="hidden">

          <!-- File List -->
          <div id="fileList" class="space-y-2 mb-4 max-h-48 overflow-y-auto"></div>

          <!-- Alert -->
          <div id="uploadAlert" class="hidden mb-3 p-3 rounded-xl text-sm"></div>

          <!-- Upload Button -->
          <button onclick="startUpload()" id="uploadBtn" class="w-full py-4 text-white rounded-2xl btn-primary text-lg font-medium shadow-md shadow-rose-100 disabled:opacity-50 transition-all"
                  disabled>
            <i class="fas fa-upload mr-2"></i>업로드하기
          </button>
          <button onclick="goToStep2()" class="w-full mt-3 text-gray-400 text-sm">← 이름 변경</button>
        </div>
      </div>
    </div>

    <!-- Step 4: Success -->
    <div id="step4" class="step">
      <div class="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-white text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">업로드 완료!</h2>
        <p class="text-gray-500 mb-2">소중한 추억을 공유해주셔서 감사합니다.</p>
        <p class="text-rose-400 font-medium text-lg serif mb-8">Thank you for sharing your memories 💕</p>
        <div class="bg-rose-50 rounded-2xl p-5 max-w-xs w-full mb-8">
          <p class="text-rose-400 font-semibold" id="successCoupleNames"></p>
          <p class="text-gray-400 text-sm mt-1">의 웨딩에 함께해주셔서 감사합니다</p>
        </div>
        <button onclick="uploadMore()" class="w-full max-w-xs py-4 text-white rounded-2xl btn-primary text-base font-medium shadow-md shadow-rose-100">
          📸 더 올리기
        </button>
        <button onclick="goToStep1()" class="w-full max-w-xs mt-3 py-3 text-gray-400 text-sm rounded-xl border border-gray-100">
          처음으로
        </button>
      </div>
    </div>

  </div>

  <script>
    const WEDDING_ID = '${weddingId}'
    let wedding = null
    let selectedFiles = []
    let guestName = ''

    async function init() {
      try {
        const res = await fetch('/api/weddings/' + WEDDING_ID + '/public')
        const data = await res.json()

        document.getElementById('loadingScreen').classList.add('hidden')

        if (!data.wedding) {
          showError('웨딩 페이지를 찾을 수 없습니다', data.error || '올바른 링크인지 확인해주세요.')
          return
        }

        wedding = data.wedding

        if (!wedding.is_active) {
          showError('비활성화된 웨딩입니다', '이 웨딩 페이지는 현재 사용 불가능합니다.')
          return
        }

        // 정보 채우기
        document.getElementById('coupleNames').textContent = wedding.bride_name + ' ♥ ' + wedding.groom_name
        document.getElementById('successCoupleNames').textContent = wedding.bride_name + ' ♥ ' + wedding.groom_name
        document.getElementById('weddingDate').textContent = formatDate(wedding.wedding_date)
        if (wedding.venue_name) {
          document.getElementById('venueName').textContent = '📍 ' + wedding.venue_name + (wedding.wedding_time ? ' · ' + wedding.wedding_time : '')
        }

        // 커버 이미지 (안전 버전)
const coverSection = document.getElementById('coverSection')
const coverFallback = document.getElementById('coverFallback')

if (wedding.cover_image_url && coverSection) {
  coverSection.querySelectorAll('img').forEach(el => el.remove())

  const img = document.createElement('img')
  img.src = wedding.cover_image_url
  img.className = 'w-full h-full object-cover'
  img.loading = 'lazy'

  img.onload = () => { if (coverFallback) coverFallback.style.display = 'none' }
  img.onerror = () => {
    img.remove()
    if (coverFallback) coverFallback.style.display = 'flex'
  }

  coverSection.appendChild(img)
}

        document.title = wedding.bride_name + ' ♥ ' + wedding.groom_name + ' - 웨딩 메모리'
        document.getElementById('mainContent').classList.remove('hidden')
      } catch(e) {
        showError('오류가 발생했습니다', '페이지를 다시 불러주세요.')
        console.error(e)
      }
    }

    function showError(title, msg) {
      document.getElementById('loadingScreen').classList.add('hidden')
      document.getElementById('errorScreen').classList.remove('hidden')
      document.getElementById('errorTitle').textContent = title
      document.getElementById('errorMsg').textContent = msg
    }

    function formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('ko-KR', {year:'numeric', month:'long', day:'numeric'})
    }

    function goToStep1() {
      activateStep('step1')
    }

    function goToStep2() {
      if (wedding && wedding.upload_disabled) {
        alert('현재 업로드가 비활성화되어 있습니다.')
        return
      }
      activateStep('step2')
      setTimeout(() => document.getElementById('guestName').focus(), 300)
    }

    function goToStep3() {
      const name = document.getElementById('guestName').value.trim()
      if (!name) {
        showNameAlert('이름을 입력해주세요.')
        return
      }
      const pattern = /^[가-힣a-zA-Z0-9\\s]+$/
      if (!pattern.test(name)) {
        showNameAlert('한글, 영문, 숫자만 입력 가능합니다.')
        return
      }
      guestName = name
      document.getElementById('guestNameDisplay').textContent = name
      selectedFiles = []
      document.getElementById('fileList').innerHTML = ''
      document.getElementById('uploadBtn').disabled = true
      activateStep('step3')
    }

    function activateStep(id) {
      document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
      document.getElementById(id).classList.add('active')
    }

    function checkName() {
      const name = document.getElementById('guestName').value.trim()
      const btn = document.getElementById('nameNextBtn')
      btn.classList.toggle('opacity-50', !name)
      document.getElementById('nameAlert').classList.add('hidden')
    }

    function showNameAlert(msg) {
      const el = document.getElementById('nameAlert')
      el.textContent = msg
      el.classList.remove('hidden')
    }

    // 파일 선택
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('fileInput').addEventListener('change', (e) => {
        const files = Array.from(e.target.files)
        addFiles(files)
        e.target.value = ''
      })

      const zone = document.getElementById('uploadZone')
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging') })
      zone.addEventListener('dragleave', () => zone.classList.remove('dragging'))
      zone.addEventListener('drop', (e) => {
        e.preventDefault()
        zone.classList.remove('dragging')
        addFiles(Array.from(e.dataTransfer.files))
      })
    })

    function addFiles(files) {
      const allowed = ['image/jpeg','image/png','image/heic','image/heif','image/webp','video/mp4','video/quicktime','video/mov']
      const maxSize = 500 * 1024 * 1024
      files.forEach(f => {
        if (!allowed.includes(f.type) && !f.name.toLowerCase().match(/\\.(jpg|jpeg|png|heic|heif|webp|mp4|mov)$/)) {
          showUploadAlert('지원하지 않는 파일: ' + f.name, 'error')
          return
        }
        if (f.size > maxSize) {
          showUploadAlert(f.name + ': 500MB를 초과합니다.', 'error')
          return
        }
        // 중복 제거
        if (!selectedFiles.find(sf => sf.name === f.name && sf.size === f.size)) {
          selectedFiles.push(f)
        }
      })
      renderFileList()
      document.getElementById('uploadBtn').disabled = selectedFiles.length === 0
    }

    function renderFileList() {
      const list = document.getElementById('fileList')
      list.innerHTML = selectedFiles.map((f, i) => \`
        <div class="file-item rounded-xl p-3 flex items-center gap-3">
          <span class="text-xl">\${f.type.startsWith('video') ? '🎬' : '📸'}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-600 truncate">\${f.name}</p>
            <p class="text-xs text-gray-300">\${formatSize(f.size)}</p>
          </div>
          <div class="flex items-center gap-2">
            <div id="status-\${i}" class="text-xs text-gray-300">대기중</div>
            <button onclick="removeFile(\${i})" class="text-gray-300 hover:text-red-400 transition-colors text-sm">✕</button>
          </div>
        </div>
      \`).join('')
    }

    function removeFile(idx) {
      selectedFiles.splice(idx, 1)
      renderFileList()
      document.getElementById('uploadBtn').disabled = selectedFiles.length === 0
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
      return (bytes/(1024*1024)).toFixed(1) + ' MB'
    }

    function showUploadAlert(msg, type='error') {
      const el = document.getElementById('uploadAlert')
      el.className = 'mb-3 p-3 rounded-xl text-sm ' + (type==='error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')
      el.textContent = msg
      el.classList.remove('hidden')
      setTimeout(() => el.classList.add('hidden'), 3000)
    }

    async function startUpload() {
      if (!selectedFiles.length || !guestName) return

      const btn = document.getElementById('uploadBtn')
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>업로드 중...'

      let successCount = 0, failCount = 0

      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i]
        const statusEl = document.getElementById('status-' + i)
        if (statusEl) statusEl.textContent = '⏳ 업로드 중...'

        try {
          const formData = new FormData()
          formData.append('file', f)

          const res = await fetch('/api/uploads/guest/' + WEDDING_ID, {
            method: 'POST',
            headers: { 'X-Guest-Name': guestName },
            body: formData
          })

          const data = await res.json()
          if (data.success) {
            successCount++
            if (statusEl) { statusEl.textContent = '✅ 완료'; statusEl.className = 'text-xs text-green-500' }
          } else {
            failCount++
            if (statusEl) { statusEl.textContent = '❌ 실패'; statusEl.className = 'text-xs text-red-400' }
          }
        } catch {
          failCount++
          if (statusEl) { statusEl.textContent = '❌ 실패'; statusEl.className = 'text-xs text-red-400' }
        }
      }

      if (successCount > 0) {
        launchConfetti()
        setTimeout(() => activateStep('step4'), 800)
      } else {
        showUploadAlert('업로드에 실패했습니다. 다시 시도해주세요.', 'error')
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-upload mr-2"></i>업로드하기'
      }
    }

    function uploadMore() {
      selectedFiles = []
      document.getElementById('fileList').innerHTML = ''
      document.getElementById('uploadBtn').disabled = true
      document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-upload mr-2"></i>업로드하기'
      activateStep('step3')
    }

    function launchConfetti() {
      const colors = ['#f0a0a0', '#c8a2c8', '#a0c8f0', '#f0e0a0', '#a0f0c0']
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const el = document.createElement('div')
          el.className = 'confetti'
          el.style.left = Math.random() * 100 + 'vw'
          el.style.top = '-20px'
          el.style.background = colors[Math.floor(Math.random() * colors.length)]
          el.style.animationDuration = (1.5 + Math.random() * 2) + 's'
          el.style.animationDelay = Math.random() * 0.5 + 's'
          document.body.appendChild(el)
          setTimeout(() => el.remove(), 3000)
        }, i * 30)
      }
    }

    init()
  </script>
</body>
</html>`
}

function superAdminPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>슈퍼어드민 - 웨딩 메모리</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>* { font-family: 'Noto Sans KR', sans-serif; } .btn-primary { background: linear-gradient(135deg, #c8a2c8 0%, #e8a0a0 100%); } .tab.active { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: #e8a0a0; }</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-white border-b border-gray-100 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">💍</span>
        <span class="text-lg font-semibold text-gray-700">슈퍼어드민</span>
        <span class="text-xs bg-rose-100 text-rose-500 px-2 py-0.5 rounded-full">관리자</span>
      </div>
      <button onclick="logout()" class="text-sm text-gray-400 hover:text-gray-600"><i class="fas fa-sign-out-alt mr-1"></i>로그아웃</button>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" id="statsGrid">
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center col-span-2 md:col-span-1">
        <div class="text-2xl font-bold text-rose-400" id="s_users">-</div>
        <div class="text-xs text-gray-400 mt-1">전체 사용자</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-purple-400" id="s_weddings">-</div>
        <div class="text-xs text-gray-400 mt-1">전체 웨딩</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-blue-400" id="s_uploads">-</div>
        <div class="text-xs text-gray-400 mt-1">전체 파일</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-green-400" id="s_guests">-</div>
        <div class="text-xs text-gray-400 mt-1">전체 게스트</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <div class="text-2xl font-bold text-orange-400" id="s_storage">-</div>
        <div class="text-xs text-gray-400 mt-1">총 저장용량</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-gray-100 rounded-2xl p-1 flex gap-1 mb-4 w-fit">
      <button onclick="showTab('weddings')" class="tab active px-4 py-2 rounded-xl text-sm font-medium text-gray-500 transition-all" id="tab-weddings">웨딩 관리</button>
      <button onclick="showTab('users')" class="tab px-4 py-2 rounded-xl text-sm font-medium text-gray-500 transition-all" id="tab-users">사용자</button>
    </div>

    <!-- Weddings Tab -->
    <div id="weddingsTab">
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center gap-3">
          <input type="text" id="searchInput" placeholder="검색..." class="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:border-rose-300">
          <button onclick="loadWeddings()" class="px-4 py-2 text-sm text-white rounded-xl btn-primary">검색</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left p-3 text-gray-500 font-medium">커플</th>
                <th class="text-left p-3 text-gray-500 font-medium hidden md:table-cell">이메일</th>
                <th class="text-left p-3 text-gray-500 font-medium hidden sm:table-cell">웨딩일</th>
                <th class="text-left p-3 text-gray-500 font-medium">플랜</th>
                <th class="text-left p-3 text-gray-500 font-medium hidden sm:table-cell">파일</th>
                <th class="text-left p-3 text-gray-500 font-medium">상태</th>
                <th class="text-left p-3 text-gray-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody id="weddingsTable"><tr><td colspan="7" class="text-center p-8 text-gray-400">불러오는 중...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div id="usersTab" class="hidden">
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left p-3 text-gray-500 font-medium">이름</th>
                <th class="text-left p-3 text-gray-500 font-medium">이메일</th>
                <th class="text-left p-3 text-gray-500 font-medium hidden sm:table-cell">가입일</th>
                <th class="text-left p-3 text-gray-500 font-medium">웨딩</th>
              </tr>
            </thead>
            <tbody id="usersTable"><tr><td colspan="4" class="text-center p-8 text-gray-400">불러오는 중...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    const token = localStorage.getItem('auth_token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user.role !== 'superadmin') {
      alert('슈퍼어드민 권한이 필요합니다.')
      window.location.href = '/login'
    }

    function getHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } }
    function formatDate(d) { return d ? new Date(d).toLocaleDateString('ko-KR') : '-' }
    function formatSize(b) { if(!b) return '-'; if(b<1024*1024) return (b/1024).toFixed(0)+'KB'; return (b/(1024*1024)).toFixed(1)+'MB' }

    async function loadStats() {
      try {
        const res = await fetch('/api/super/stats', { headers: getHeaders() })
        const data = await res.json()
        if (data.stats) {
          document.getElementById('s_users').textContent = data.stats.total_users
          document.getElementById('s_weddings').textContent = data.stats.total_weddings
          document.getElementById('s_uploads').textContent = data.stats.total_uploads
          document.getElementById('s_guests').textContent = data.stats.total_guests
          document.getElementById('s_storage').textContent = formatSize(data.stats.total_storage_bytes)
        }
      } catch(e) { console.error(e) }
    }

    async function loadWeddings() {
      const search = document.getElementById('searchInput').value
      try {
        const res = await fetch('/api/super/weddings?search=' + encodeURIComponent(search), { headers: getHeaders() })
        const data = await res.json()
        const planNames = {plan_a:'3일', plan_b:'7일', plan_c:'평생'}
        document.getElementById('weddingsTable').innerHTML = (data.weddings || []).map(w => \`
          <tr class="border-t border-gray-50 hover:bg-gray-50">
            <td class="p-3 font-medium">\${w.bride_name} ♥ \${w.groom_name}</td>
            <td class="p-3 text-gray-500 hidden md:table-cell">\${w.owner_email || '-'}</td>
            <td class="p-3 text-gray-500 hidden sm:table-cell">\${formatDate(w.wedding_date)}</td>
            <td class="p-3"><span class="text-xs bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full">\${planNames[w.plan_id]||w.plan_id}</span></td>
            <td class="p-3 text-gray-500 hidden sm:table-cell">\${w.upload_count || 0}개</td>
            <td class="p-3">
              <span class="text-xs px-2 py-0.5 rounded-full \${w.is_active ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}">
                \${w.is_active ? '활성' : '비활성'}
              </span>
            </td>
            <td class="p-3">
              <div class="flex gap-1">
                <button onclick="\${w.is_active ? 'disableWedding' : 'enableWedding'}('\${w.id}')"
                  class="text-xs px-2 py-1 rounded-lg \${w.is_active ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}">
                  \${w.is_active ? '비활성화' : '활성화'}
                </button>
              </div>
            </td>
          </tr>
        \`).join('') || '<tr><td colspan="7" class="text-center p-8 text-gray-400">웨딩이 없습니다</td></tr>'
      } catch(e) { console.error(e) }
    }

    async function loadUsers() {
      try {
        const res = await fetch('/api/super/users', { headers: getHeaders() })
        const data = await res.json()
        document.getElementById('usersTable').innerHTML = (data.users || []).map(u => \`
          <tr class="border-t border-gray-50 hover:bg-gray-50">
            <td class="p-3 font-medium">\${u.name}</td>
            <td class="p-3 text-gray-500">\${u.email}</td>
            <td class="p-3 text-gray-500 hidden sm:table-cell">\${formatDate(u.created_at)}</td>
            <td class="p-3 text-gray-500">\${u.wedding_count || 0}개</td>
          </tr>
        \`).join('') || '<tr><td colspan="4" class="text-center p-8 text-gray-400">사용자가 없습니다</td></tr>'
      } catch(e) { console.error(e) }
    }

    async function disableWedding(id) {
      if (!confirm('웨딩을 비활성화하시겠습니까?')) return
      await fetch('/api/super/weddings/' + id + '/disable', { method: 'PUT', headers: getHeaders() })
      loadWeddings()
    }

    async function enableWedding(id) {
      await fetch('/api/super/weddings/' + id + '/enable', { method: 'PUT', headers: getHeaders() })
      loadWeddings()
    }

    function showTab(t) {
      document.getElementById('weddingsTab').classList.toggle('hidden', t !== 'weddings')
      document.getElementById('usersTab').classList.toggle('hidden', t !== 'users')
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'))
      document.getElementById('tab-' + t).classList.add('active')
      if (t === 'users') loadUsers()
    }

    function logout() {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    loadStats()
    loadWeddings()
  </script>
</body>
</html>`
}

export default app

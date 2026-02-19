// QR 코드 생성 유틸리티 (SVG 기반, Cloudflare Workers 호환)

// QR 코드를 SVG 문자열로 생성
export async function generateQRCodeSVG(text: string): Promise<string> {
  // qrcode 라이브러리 대신 간단한 QR 코드 API 활용
  // 서버사이드에서는 외부 API를 통해 QR 생성, 또는 인코딩 로직 사용
  const encoded = encodeURIComponent(text)
  // QR 코드 SVG를 직접 생성하는 간단한 구현
  return generateSimpleQR(text)
}

// Base64 데이터 URL 형태로 QR 코드 반환
export async function generateQRCodeDataURL(text: string): Promise<string> {
  const svg = await generateQRCodeSVG(text)
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}

// QR 코드 간단 구현 (Reed-Solomon 없는 기본 버전)
// 실제 서비스에서는 qrcode 패키지의 브라우저 버전을 사용
function generateSimpleQR(text: string): string {
  // QR 코드 플레이스홀더 SVG (실제 구현은 프론트엔드에서 qrcode.js 활용)
  const size = 200
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#666">
      QR: ${text.substring(0, 30)}...
    </text>
  </svg>`
}

// QR URL 생성
export function generateWeddingURL(baseUrl: string, weddingId: string): string {
  return `${baseUrl}/wedding/${weddingId}`
}

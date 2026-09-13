export const config = { runtime: 'edge' }

const SITE_URL = 'https://www.katsurank.kr'
const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'https://api.katsurank.kr'
const DEFAULT_IMAGE = `${SITE_URL}/images/katsurank-favicon.png`
const DEFAULT_TITLE = '카츠랭 | 당신의 인생 돈까스에 투표하세요'
const DEFAULT_DESCRIPTION =
  '서울 최고의 돈까스집을 가리는 1인 1표 랭킹 서비스. 당신의 인생 돈까스에 투표하고, 더 맛있는 곳을 찾으면 언제든 표를 옮기세요.'

type RestaurantResponse = {
  name: string
  address: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHtml({ title, description, url }: { title: string; description: string; url: string }): string {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeUrl = escapeHtml(url)

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="카츠랭" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${DEFAULT_IMAGE}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${DEFAULT_IMAGE}" />
</head>
<body></body>
</html>`
}

function htmlResponse(html: string): Response {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

// 카카오톡/슬랙 등 링크 미리보기 봇 전용 라우트 — vercel.json의 rewrite가 해당 User-Agent만 여기로 보낸다.
// 실제 사용자는 그대로 SPA(index.html)를 받으므로 이 파일은 크롤러 대응 메타태그 생성 목적으로만 쓴다.
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const idParam = url.searchParams.get('restaurant') ?? ''
  const id = Number(idParam)
  const shareUrl = `${SITE_URL}/?restaurant=${encodeURIComponent(idParam)}`

  if (!Number.isInteger(id) || id <= 0) {
    return htmlResponse(renderHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: SITE_URL }))
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/${id}`)
    const body = (await res.json().catch(() => null)) as { data?: RestaurantResponse } | null
    const restaurant = body?.data

    if (!res.ok || !restaurant?.name) {
      throw new Error('restaurant not found')
    }

    const title = `${restaurant.name} | 카츠랭`
    const description = restaurant.address
      ? `${restaurant.address} · 카츠랭에서 ${restaurant.name}에 투표하고 랭킹을 확인해보세요.`
      : `카츠랭에서 ${restaurant.name}에 투표하고 랭킹을 확인해보세요.`

    return htmlResponse(renderHtml({ title, description, url: shareUrl }))
  } catch {
    return htmlResponse(renderHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: shareUrl }))
  }
}

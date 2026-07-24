const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// XSRF-TOKEN 쿠키는 프론트·백엔드가 다른 도메인일 때(로컬 dev ↔ 배포 API) document.cookie로 못 읽는다.
// 대신 GET /api/v1/auth/csrf 응답 body의 token 값을 메모리에 저장해서 쓴다 (fetchCsrf가 채움).
let csrfToken = '';

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (MUTATING.has(method) && csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (isEnvelope(body) ? body.error : body) ?? {};
    throw new ApiError(err.code ?? 'UNKNOWN', err.message ?? res.statusText, res.status);
  }

  return (isEnvelope(body) ? body.data : body) as T;
}

function isEnvelope(
  body: unknown,
): body is { success: boolean; data: unknown; error: { code: string; message: string } | null } {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body;
}

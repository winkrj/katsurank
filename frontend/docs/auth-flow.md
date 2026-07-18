# 카카오 로그인 흐름

백엔드가 카카오 OAuth2 + 외부저장소 세션(spring-session-jdbc)으로 인증을 전담한다. 프론트는 API를 직접
호출하지 않고 **링크 이동 + 쿠키 자동 동봉**만 담당한다. (JWT 미사용, `docs/03_data_model_and_tech.md` 1.1/1.2 참조)

## 흐름

```
1. [프론트] "카카오 로그인" 클릭
     → window.location = {백엔드}/oauth2/authorization/kakao
       (Spring Security가 제공하는 엔드포인트. 우리가 만든 API 아님)
2. [백엔드] 카카오 로그인 페이지로 302
3. [카카오] 로그인 완료
     → {백엔드}/login/oauth2/code/kakao 로 콜백
4. [백엔드] CustomOAuth2UserService: User upsert (신규 가입 / 기존 갱신)
5. [백엔드] 인증 성공 → 세션 생성 → SESSION 쿠키(HttpOnly, Secure, SameSite) 발급
     → {frontendUrl}/oauth/callback 로 302 (OAuth2SuccessHandler.java:29)
6. [프론트] /oauth/callback 도착 → '/'로 리다이렉트
     → AppLayout의 AuthInit이 GET /api/v1/auth/me 호출 → 200이면 로그인 상태로 authStore 채움
7. [프론트] 이후 모든 요청은 credentials: 'include'로 쿠키 자동 동봉
```

## 프론트 구현 매핑

| 단계 | 파일 |
|---|---|
| 로그인 버튼 → 리다이렉트 | `src/shared/ui/header/KakaoLoginButton.tsx`, `HomeHeaderAuth.tsx` → `KAKAO_LOGIN_URL` (`src/shared/constant/api.ts`) |
| OAuth 콜백 착지 페이지 | `src/pages/oauth/KakaoCallbackPage.tsx`, 라우트 `src/app/routes.tsx` (`/oauth/callback`) |
| 로그인 상태 확인 (`GET /api/v1/auth/me`) | `src/shared/api/auth.ts` `fetchAuthMe`, `src/shared/queries/auth.ts` `useAuthMeQuery` |
| CSRF 부트스트랩 (`GET /api/v1/auth/csrf`) | `useCsrfBootstrapQuery` — SPA 최초 로드 시 1회 호출해 `XSRF-TOKEN` 쿠키 발급 |
| 세션 상태 저장 | `src/shared/stores/authStore.ts` (zustand, persist 없음 — 새로고침마다 `/auth/me`로 재확인) |
| 로그아웃 (`POST /api/v1/auth/logout`) | `useLogoutMutation` — 서버 세션 무효화 + `SESSION` 쿠키 삭제까지 백엔드가 처리 |
| CSRF 헤더 자동 첨부 | `src/shared/api/client.ts` `apiClient` — POST/PUT/PATCH/DELETE 시 `XSRF-TOKEN` 쿠키 값을 `X-XSRF-TOKEN` 헤더로 첨부 |

## 실제 응답 스키마 (백엔드 소스 기준)

```ts
// GET /api/v1/auth/me — AuthController.java, MeResponse.java
// 401이면 미로그인 (정상 케이스, 에러 아님)
type AuthMeResponse = {
  id: number
  nickname: string
  profileImage: string | null
}

// GET /api/v1/auth/csrf — CsrfTokenResponse.java
// 응답값 자체는 안 씀. 호출하는 것 자체가 XSRF-TOKEN 쿠키 발급을 트리거함.
type CsrfTokenResponse = {
  token: string
  headerName: string
  parameterName: string
}
```

`GET /api/v1/auth/me`와 `GET /api/v1/me`(마이페이지, `currentVote` 포함)는 서로 다른 엔드포인트/DTO다.
헷갈리지 말 것 — 전자는 로그인 상태 확인용 최소 정보, 후자는 마이페이지 전체 프로필.

## 이번에 고친 버그 (기존 코드가 실제로 로그인 흐름을 깨뜨리고 있었음)

1. **콜백 경로 불일치** — 백엔드는 `{frontendUrl}/oauth/callback`으로 리다이렉트하는데
   프론트 라우트는 `/oauth/kakao/callback`이었음. 로그인 성공 후 매칭되는 라우트가 없어 흐름이 끊김.
   → `src/app/routes.tsx` 경로를 `/oauth/callback`으로 수정.
2. **`hasLoginCookie()`가 항상 false** — `SESSION` 쿠키는 HttpOnly라 `document.cookie`로 읽을 수 없는데,
   `useAuthMeQuery`가 이 값으로 `enabled`를 게이팅하고 있어서 `/api/v1/auth/me`가 영원히 호출되지 않았음
   (로그인해도 항상 게스트로 보임). → 게이팅 제거, 항상 호출하고 401을 정상 케이스로 처리.
3. **`fetchAuthMe`/`fetchCsrf`가 목업만 반환** — 실제 API 호출이 주석 처리되어 있었음. → 연결.
4. **로그아웃이 프론트 상태만 지웠음** — `POST /api/v1/auth/logout`을 호출하지 않아 서버 세션이 계속 살아있었음
   (로그아웃해도 다시 `/`에 오면 세션 쿠키로 재로그인됨). → `useLogoutMutation`으로 실제 호출 추가.
> **포트 관련 메모(수정 안 함):** `application.yml`의 `app.frontend-url`/`app.cors.allowed-origins` 기본값은
> `http://localhost:3000`으로 박혀 있지만, 실제 로컬 개발은 Vite 기본 포트인 `5173`을 씀. 즉 백엔드를 로컬에서 띄울 때
> `APP_FRONTEND_URL`/`APP_CORS_ALLOWED_ORIGINS` 환경변수로 `5173`을 오버라이드해서 실행하고 있다는 뜻 (리포에는 그 설정이
> 안 보여서 IDE 실행 설정이나 로컬 셸 env로 주는 것으로 추정). 프론트 쪽은 손댈 필요 없음 — 포트는 5173 그대로 둠.

## 아직 남은 것 / 확인 필요

- `.env.local`의 `VITE_LOGIN_COOKIE_KEY`는 이제 코드에서 안 씀 (지워도 무방, 그대로 둬도 무해).
- 목업 데이터는 전부 제거하고 실제 API(`/api/v1/me`, `/ranking`, `/restaurants/*`, `/votes` 등)로 연결 완료.
  실제 응답 DTO는 백엔드 소스(`RestaurantController`, `RankingController`, `MeController`, `VoteController` 등) 기준으로
  프론트 타입을 맞췄음 — 상세는 각 `src/shared/types/*.ts` 참고.

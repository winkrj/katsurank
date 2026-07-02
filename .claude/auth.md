---
paths:
  - "src/main/java/com/katsurank/auth/**"
  - "src/main/java/com/katsurank/config/**"
---

# 인증 · 보안 규칙

상세 흐름은 `docs/03_data_model_and_tech.md`의 1.1 / 1.2 섹션 참조.

- 카카오 OAuth2 로그인 성공 후 **세션 쿠키**(HttpOnly, SameSite) 발급. JWT 금지.
- 세션은 톰캣 인메모리가 아니라 **외부 저장소**(spring-session-jdbc, PostgreSQL)에 저장.
- OAuth 콜백은 SPA 대응: 인증 성공 후 **프론트 도메인으로 302 리다이렉트** (`OAuth2SuccessHandler` 커스텀). 백엔드가 자기 화면을 띄우지 않음.
- 쿠키 도메인: 운영 `Domain=.katsurank.kr`, 로컬 `localhost`.
- CORS: 프론트 오리진만 허용(`https://katsurank.kr`, `http://localhost:3000`), `allowCredentials(true)`.
- CSRF: 처음부터 켠다. `CookieCsrfTokenRepository.withHttpOnlyFalse()` (Double Submit Cookie).
- 인증된 사용자는 `@LoginUser` 커스텀 ArgumentResolver로 컨트롤러에서 주입.
- 카카오에서 받는 정보는 최소: kakaoId, nickname, profileImage. 이메일 수집 금지.

# 협업 규칙 (CONTRIBUTING)

이 문서는 카츠랭 프로젝트에 참여하는 사람들이 어떻게 같이 일할지 정한 규칙입니다. 처음 합류하면 이것부터 읽으세요.

## 단일 진실의 출처(SSOT)

- **모든 기획·디자인·기술 결정은 `docs/` 폴더의 마크다운**으로만 존재합니다
- 슬랙·디스코드 채팅, 카톡, 머릿속은 **공식 결정이 아닙니다**
- 새 결정이 나오면 → 해당 문서 갱신 → PR → 머지. 그 다음 코드로 갑니다

## OpenSpec과 docs/의 관계

기능 개발에 OpenSpec(SDD, `/opsx:propose` 등)을 쓰는 경우, `openspec/specs/`는 기능별 최신 요구사항(빠르게 바뀌는 세부 스펙)을 담당하고, `openspec/changes/`는 백엔드·프론트가 코드를 쓰기 전에 기능 계약(요구사항·API 모양)에 합의하는 단계로 쓴다. `docs/`의 권한은 그대로다 — 이미 `03_data_model_and_tech.md`가 "정확한 최신 API 스펙은 Swagger UI를 참고"라며 세부사항을 다른 곳에 위임한 전례가 있듯, OpenSpec의 두 폴더는 그 세부사항 계층의 확장이지 대체가 아니다. change proposal 안에서 **오래 남을 결정**(새 아키텍처 선택, 스코프 변경 등)이 나오면 그 결정만 기존 흐름대로 `docs/`에도 반영한다 (결정 → 문서 갱신 → PR → 머지). `openspec/`도 PR 대상이지만 `docs/` 갱신을 대신하지 않는다.

사전 준비: Node 20.19+ 확인 후 `npm install -g @fission-ai/openspec@latest`로 각자 로컬에 글로벌 설치 (레포에 루트 `package.json`이 없어 devDependency로 못 넣음 — 백엔드·프론트 담당 둘 다 설치 필요).

## 역할 분담

| 영역 | 1차 담당 | 결정권 |
|---|---|---|
| 백엔드 (Spring Boot, API, DB) | 본인 | 본인 |
| 프론트 (Vite+React, UI) | 협업자 | 협업자 |
| 기획·우선순위 | 본인 (PM) | 본인 |
| 디자인 가이드 | 같이 | 합의 (안 되면 본인 결정권) |
| DevOps·배포 | 본인 | 본인 |

각자 자기 영역은 자기가 결정하고 책임집니다. 다른 영역에 의견은 환영, 결정은 담당자가.

## 브랜치 전략

- `main`: 항상 배포 가능한 상태. 직접 푸시 금지
- 작업 브랜치: `feat/<짧은-설명>`, `fix/<짧은-설명>`, `docs/<짧은-설명>`, `chore/<짧은-설명>`
- 모든 변경은 PR을 통해 `main`으로 머지

브랜치 이름 예시:
- `feat/kakao-oauth-login`
- `feat/restaurant-add-api`
- `fix/cors-credentials`
- `docs/api-contract-v0.2`

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 따릅니다.

```
<type>: <subject>

<body (선택)>
```

타입:
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서만 변경
- `style`: 포맷팅, 세미콜론 등 (로직 변경 X)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 패키지, 설정 등

예시:
- `feat: 카카오 OAuth 로그인 구현`
- `fix: 가게 추가 시 카테고리 검증 오류`
- `docs: 디자인 가이드 v0.2 — 빨강 톤 조정`
- `chore: PostgreSQL 16으로 업그레이드`

## PR 규칙

1. **한 명 approve 필수**: 둘이 있는 동안은 다른 한 명이 무조건 리뷰
2. **CI 통과 필수**: GitHub Actions 빨간불이면 머지 안 됨
3. **본인이 자기 PR을 머지** (리뷰는 상대가, 머지는 본인이)
4. **머지 후 브랜치 삭제** (GitHub UI에서 자동)
5. **머지 방식**: Squash and merge (커밋 히스토리 깔끔)

PR 제목도 Conventional Commits 형식.

PR 본문 템플릿:
```markdown
## 무엇
- (이 PR이 뭘 하는지 1~3줄)

## 왜
- (왜 필요한지)

## 어떻게 확인
- [ ] 로컬에서 동작 확인
- [ ] 관련 테스트 추가/수정

## 관련 이슈
- Closes #<번호>
```

## 이슈 관리

- 새 작업은 무조건 Issue 먼저, 그 다음 브랜치
- Issue 제목: `[feat] 카카오 OAuth 로그인`, `[bug] 가게 추가 시 CORS 오류`
- 라벨: `backend`, `frontend`, `docs`, `bug`, `enhancement`, `priority:high/mid/low`
- 마일스톤: `V1`, `V1.1`, `V2`

## 문서 변경 흐름

1. 누군가 문서 변경 필요성을 느낌
2. (마스터 창에서) Claude에 부탁해서 새 버전 마크다운 받음
3. 브랜치 만들어서 푸시 (`docs/...`)
4. PR로 머지
5. 자동 알림이 Slack/Discord에 감
6. 다른 사람은 다음 작업 시 최신 버전 참조

**문서 버전 규칙:**
- 파일명은 버전 안 붙임 (예: `01_product_spec.md`, `_v0.2` X)
- Git 히스토리가 버전 관리
- 큰 변경이면 문서 안의 *"변경 이력"* 섹션에 한 줄 추가

## 소통 도구

- **GitHub**: 코드, 문서, 결정 (공식 기록)
- **Discord/Slack**: 일상 소통, 빠른 질문, 화면 공유
- 중요 결정은 채팅에 묻히지 않게 GitHub Issue로 옮기기

## 비밀 정보 관리

> ⚠️ Public 레포입니다. 다음 것들 절대 커밋 금지:

- 카카오 API 키, OAuth Client Secret
- DB 비밀번호 (운영용)
- 개인 이메일·전화번호
- 운영 도메인의 SSL 인증서

→ 무조건 `.env`로 분리, `.gitignore`에 포함. `application.yml`은 `${ENV_VAR}` 형태로만.

## 분쟁 해결

의견 충돌이 나면:

1. 먼저 채팅으로 짧게 논의
2. 안 풀리면 GitHub Issue로 옮겨서 글로 정리
3. 그래도 안 풀리면 영역 담당자의 결정권 행사
4. 도메인 경계가 애매하면 본인(PM)이 결정

## 코드 리뷰 톤

- 사람이 아닌 코드를 비판
- "이렇게 하면 어때요?" 보다 "왜 이렇게 짰는지" 먼저 묻기
- 칭찬도 코멘트로 (좋은 코드엔 👍)
- 30분 안에 답 어려운 PR은 *"내일 볼게요"* 한 줄이라도 남기기

# GitHub 레포 첫 셋업 가이드

이 파일은 카츠랭 GitHub 레포를 처음 만들 때 한 번만 보면 되는 가이드입니다. 셋업 끝나면 이 파일은 삭제하거나 docs에서 빼셔도 됩니다.

---

## 1. GitHub에서 새 레포 만들기 (3분)

1. https://github.com/new 접속
2. 다음 입력:
   - **Repository name**: `katsurank`
   - **Description**: `당신의 인생 돈까스 한 집. 1인 1표 돈까스 랭킹 사이트.`
   - **Visibility**: **Public** ← 선택
   - **Initialize**: 아무것도 체크하지 마세요 (README, .gitignore 우리가 이미 만듦)
3. **Create repository** 클릭

---

## 2. 로컬에 파일 배치 (5분)

내가 만들어드린 파일들을 다음 구조로 배치하세요:

```
katsurank/                            ← 새 폴더 만들기
├── .github/
│   ├── workflows/
│   │   └── docs-notify.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   └── pull_request_template.md
├── docs/
│   ├── 00_index.md
│   ├── 01_product_spec.md           ← 다운로드한 v0.2 파일에서 _v0.2 빼고 이 이름으로
│   ├── 02_mvp_scope.md
│   ├── 03_data_model_and_tech.md
│   ├── 04_brand_design_guide.md
│   ├── 05_week1_setup_guide.md
│   └── setup/
│       ├── application.yml
│       └── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── .gitignore
└── .env.example
```

> ⚠️ 파일명에서 `_v0.1`, `_v0.2` 빼고 단순화하세요. 이제 Git 히스토리가 버전 관리합니다.

---

## 3. Git 초기화 + 첫 푸시 (5분)

터미널에서:

```bash
cd /path/to/katsurank

# Git 초기화
git init
git branch -M main

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "chore: 프로젝트 초기 셋업 — 문서·README·협업 규칙"

# 원격 레포 연결 (USERNAME 본인 깃헙 아이디로 바꾸기)
git remote add origin https://github.com/USERNAME/katsurank.git

# 푸시
git push -u origin main
```

푸시 후 GitHub에서 새로고침하면 README 보입니다.

---

## 4. 협업자 초대 (1분)

1. GitHub 레포 페이지 → **Settings** → **Collaborators**
2. **Add people** → 협업자 GitHub 아이디 입력
3. 협업자가 이메일 초대 수락하면 끝

---

## 5. main 브랜치 보호 (3분)

> 둘이 협업하니까 직접 푸시 막아두기

1. **Settings** → **Branches** → **Add branch protection rule**
2. **Branch name pattern**: `main`
3. 체크:
   - ☑ Require a pull request before merging
     - ☑ Require approvals (1명)
   - ☑ Require status checks to pass before merging (옵션, 워크플로 추가 시)
   - ☑ Do not allow bypassing the above settings
4. **Create**

---

## 6. Discord/Slack 웹훅 셋업 (5분)

### Discord 사용 시

1. Discord 서버 만들기 (없으면): https://discord.com → 서버 만들기 → 이름 "카츠랭"
2. 채널 만들기:
   - `#general` (잡담)
   - `#backend` (백엔드 작업)
   - `#frontend` (프론트 작업)
   - `#decisions` (중요 결정 아카이브)
3. `#decisions` 채널 → 톱니바퀴(⚙) → **연동** → **웹후크** → **새로운 웹후크**
4. 웹훅 URL 복사
5. GitHub 레포 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `DISCORD_WEBHOOK`
   - Value: 복사한 URL
6. 협업자도 Discord 초대

### Slack 사용 시

1. https://slack.com 워크스페이스 만들기
2. https://api.slack.com/messaging/webhooks 따라가서 Incoming Webhook 생성
3. 웹훅 URL 복사
4. GitHub Secret 등록 — 이름: `SLACK_WEBHOOK`
5. `.github/workflows/docs-notify.yml` 열어서 Discord 단계 주석 처리, Slack 단계 주석 풀기
6. 변경 푸시

---

## 7. 첫 테스트 (2분)

docs 폴더의 아무 파일 작게 수정 → 푸시 → Discord/Slack 알림 오는지 확인.

```bash
# 예시
echo "" >> docs/00_index.md
git add docs/00_index.md
git commit -m "docs: 알림 테스트"
git push
```

알림이 안 오면:
- GitHub 레포 → **Actions** 탭에서 워크플로 실행 결과 확인
- 빨간불이면 로그 보고 디버깅

---

## 8. (선택) Raw URL 정리

협업자나 Claude가 raw URL로 문서 가져오려면:

```
https://raw.githubusercontent.com/USERNAME/katsurank/main/docs/01_product_spec.md
```

이런 URL을 *책갈피*나 Discord `#decisions` 채널 핀에 박아두면 매번 찾기 쉽습니다.

---

## 끝났으면

이 파일(`SETUP.md`)은 더 이상 필요 없으니 삭제하거나 docs/에서 빼셔도 됩니다.

다음 작업: **1주차 Day 1 작업** → [`docs/05_week1_setup_guide.md`](docs/05_week1_setup_guide.md)

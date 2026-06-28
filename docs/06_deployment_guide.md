# 카츠랭 — 배포 가이드 (백엔드)

- **버전**: v0.1
- **작성일**: 2026-06-28
- **대상**: Oracle Cloud Free Tier + Nginx + GitHub Actions CI/CD
- **전제**: API v1 로컬 테스트 완료, `main` 브랜치 안정

---

## 전체 흐름

```
[도메인 구매]
     │
[CloudFlare 등록]          ← DNS + CDN + DDoS 방어
     │
[Oracle Cloud VM 생성]     ← 서버 프로비저닝
     │
[서버 초기 설정]            ← Java, PostgreSQL, 방화벽
     │
[환경 변수 + systemd]       ← 앱 실행 환경
     │
[GitHub Secrets 등록]      ← CI/CD에서 쓸 비밀값
     │
[첫 수동 배포 확인]         ← CI/CD 연결 전 동작 검증
     │
[Nginx + SSL 설정]          ← HTTPS 리버스 프록시
     │
[DNS A 레코드 연결]         ← 도메인 → 서버 IP
     │
[카카오 디벨로퍼스 업데이트] ← Redirect URI 추가
     │
[CI/CD 자동 배포 테스트]    ← push → Actions → 배포
     │
[모니터링 확인]             ← 로그, 헬스체크
```

**총 소요 시간 예상**: 집중하면 4~6시간 (서버 생성 대기 포함)

---

## 0단계. 사전 준비 체크리스트

- [ ] Oracle Cloud 계정 생성 (oracle.com/cloud/free, 신용카드 필요 - 청구 안 됨)
- [ ] CloudFlare 계정 생성 (cloudflare.com, 무료)
- [ ] 카카오 디벨로퍼스 앱이 이미 있는지 확인 (없으면 developers.kakao.com에서 생성)
- [ ] 로컬에 SSH 키 있는지 확인: `ls ~/.ssh/id_ed25519.pub`
  - 없으면: `ssh-keygen -t ed25519 -C "katsurank-deploy"`
- [ ] 도메인 구매 예산 확인 (.kr 연 1~2만원, Gabia 기준)

---

## 1단계. 도메인 등록

**목적**: 이후의 모든 것(SSL, 카카오 OAuth)이 도메인 기준으로 설정되므로 제일 먼저.

### 1-1. Gabia에서 .kr 도메인 구매

1. [gabia.com](https://gabia.com) 접속 → `katsurank.kr` 검색
2. 장바구니 → 결제 (연 약 1~2만원)
3. 도메인 관리 → 네임서버 탭 진입 (아직 바꾸지 않아도 됨 — CloudFlare 등록 후 바꿀 것)

### 1-2. CloudFlare에 도메인 추가

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**
2. `katsurank.kr` 입력 → **Free 플랜** 선택
3. CloudFlare가 기존 DNS 레코드를 자동 스캔함 → Continue
4. CloudFlare가 **Nameserver 2개**를 알려줌 (예: `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
5. Gabia → 도메인 관리 → 네임서버 변경 → CloudFlare 네임서버 2개 입력 → 저장
6. 반영까지 최대 24시간 (보통 30분~2시간). CloudFlare 대시보드에서 "Active" 뜨면 완료.

> **A 레코드는 아직 추가하지 않는다.** 서버 IP 확정 후에 추가.

---

## 2단계. Oracle Cloud — VM 생성

### 2-1. 계정 생성

1. [oracle.com/cloud/free](https://oracle.com/cloud/free) → **Start for Free**
2. 이메일, 국가(South Korea), 결제카드 입력
   - Always Free는 **카드 청구 없음** (단, 유료 리소스 생성 시 청구됨 — 이 가이드는 전부 Free Tier)
3. 홈 리전(Home Region) 선택: **South Korea Central (Seoul)** or **Japan East (Tokyo)**
   - 한번 설정하면 변경 불가. 국내 서비스면 Seoul 추천.

### 2-2. VM 인스턴스 생성

1. OCI 콘솔 → 왼쪽 메뉴 → **Compute** → **Instances** → **Create Instance**

2. **Name**: `katsurank-prod`

3. **Placement**: 기본값 (Seoul AD-1)

4. **Image and shape** → Change image:
   - Image: **Canonical Ubuntu** → **24.04**
   - 버전: 24.04 (LTS)

5. **Shape** → Change shape:
   - Series: **Ampere**
   - Shape: **VM.Standard.A1.Flex**
   - OCPU: **2** (총 4 OCPU까지 Always Free)
   - Memory: **12 GB** (총 24 GB까지 Always Free)

6. **Networking**:
   - Virtual Cloud Network: 기본 생성 VCN 사용 or 새로 생성
   - Subnet: Public Subnet 선택 (Public IP 필요)
   - Public IP: **Assign a public IPv4 address** 체크

7. **Add SSH keys**:
   - **Paste public keys** 선택
   - 터미널에서 복사: `cat ~/.ssh/id_ed25519.pub`
   - 텍스트박스에 붙여넣기

8. **Boot volume**: 기본값 (50GB, Always Free)

9. **Create** 클릭 → 2~3분 후 Running 상태

10. 인스턴스 상세 페이지에서 **Public IP 주소** 메모 (예: `140.xxx.xxx.xxx`)

### 2-3. 방화벽 설정 — OCI Security List

Oracle Cloud는 방화벽이 **2단계**다. 이 단계에서는 OCI 콘솔 레벨.

1. Networking → Virtual Cloud Networks → 내 VCN 클릭
2. Security Lists → **Default Security List** 클릭
3. **Add Ingress Rules** (각각 하나씩 추가):

| Source CIDR | Protocol | Port | 용도 |
|---|---|---|---|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

(22 포트는 이미 있음 — SSH)

---

## 3단계. 서버 초기 설정

### 3-1. SSH 접속

```bash
ssh ubuntu@140.xxx.xxx.xxx   # 메모한 Public IP
```

처음 접속 시 "Are you sure you want to continue connecting?" → `yes`

### 3-2. 방화벽 설정 — Linux iptables (자주 까먹는 함정!)

Oracle Cloud Ubuntu에는 OCI Security List와 **별개로** Linux 자체 방화벽(iptables)이 있다.
OCI 콘솔에서만 열면 80/443이 안 뚫림. 둘 다 열어야 한다.

```bash
# iptables에 HTTP, HTTPS 허용 규칙 추가
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# 재부팅 후에도 유지되도록 저장
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

### 3-3. 패키지 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

(5~10분 소요)

### 3-4. Java 21 설치

```bash
sudo apt install -y openjdk-21-jdk

# 확인
java -version
# 출력: openjdk version "21.x.x" ...
```

### 3-5. PostgreSQL 16 설치

```bash
sudo apt install -y postgresql postgresql-contrib

# 부팅 시 자동 시작 설정
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 확인
sudo systemctl status postgresql
# Active: active (running) 뜨면 OK
```

### 3-6. PostgreSQL DB + 유저 생성

```bash
# postgres 슈퍼유저로 전환
sudo -u postgres psql
```

psql 프롬프트에서:
```sql
-- DB 생성
CREATE DATABASE katsurank;

-- 앱 전용 유저 생성 (비밀번호는 강하게 — 특수문자 가능)
CREATE USER katsurankapp WITH ENCRYPTED PASSWORD 'your-strong-password-here';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE katsurank TO katsurankapp;

-- PostgreSQL 16부터 스키마 권한 별도 부여 필요
\c katsurank
GRANT ALL ON SCHEMA public TO katsurankapp;

-- 종료
\q
```

> 비밀번호를 어딘가 메모해 둔다. 다음 단계에서 환경변수에 쓴다.

### 3-7. Nginx 설치

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3-8. Certbot 설치 (SSL용)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3-9. 앱 디렉토리 생성

```bash
sudo mkdir -p /opt/katsurank
sudo chown ubuntu:ubuntu /opt/katsurank
```

---

## 4단계. 환경 변수 파일 + systemd 서비스

### 4-1. 환경 변수 파일 생성

```bash
sudo mkdir -p /etc/katsurank
sudo nano /etc/katsurank/env
```

아래 내용 입력 (값은 실제 값으로 교체):

```env
# DB — jdbc: 형식 (JDBC URL)
DATABASE_URL=jdbc:postgresql://localhost:5432/katsurank
DATABASE_USERNAME=katsurankapp
DATABASE_PASSWORD=your-strong-password-here

# 카카오 OAuth
KAKAO_CLIENT_ID=카카오디벨로퍼스에서_복사
KAKAO_CLIENT_SECRET=카카오디벨로퍼스에서_복사
KAKAO_REST_API_KEY=카카오디벨로퍼스에서_복사

# 앱 설정
APP_FRONTEND_URL=https://katsurank.kr
APP_CORS_ALLOWED_ORIGINS=https://katsurank.kr
APP_COOKIE_DOMAIN=katsurank.kr
APP_COOKIE_SECURE=true
APP_COOKIE_SAME_SITE=Lax
```

저장: Ctrl+X → Y → Enter

```bash
# 비밀파일이므로 root 소유 + 600 권한
sudo chown root:root /etc/katsurank/env
sudo chmod 600 /etc/katsurank/env
```

### 4-2. systemd 서비스 파일 생성

```bash
sudo nano /etc/systemd/system/katsurank.service
```

```ini
[Unit]
Description=Katsurank Spring Boot
After=network.target postgresql.service

[Service]
User=ubuntu
EnvironmentFile=/etc/katsurank/env
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/katsurank/app.jar --spring.profiles.active=prod
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

저장 후:

```bash
sudo systemctl daemon-reload
sudo systemctl enable katsurank
```

---

## 5단계. GitHub Secrets 등록

GitHub 리포지토리 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret 이름 | 값 |
|---|---|
| `PROD_HOST` | 서버 Public IP (예: `140.xxx.xxx.xxx`) |
| `PROD_USER` | `ubuntu` |
| `PROD_SSH_KEY` | SSH 개인키 전체 내용 (`cat ~/.ssh/id_ed25519` — 로컬 맥에서) |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/katsurank` |
| `DATABASE_USERNAME` | `katsurankapp` |
| `DATABASE_PASSWORD` | 3-6에서 설정한 비밀번호 |
| `KAKAO_CLIENT_ID` | 카카오 디벨로퍼스 앱 → 앱 키 → REST API 키 위의 것 |
| `KAKAO_CLIENT_SECRET` | 카카오 로그인 → 보안 → Client Secret |
| `KAKAO_REST_API_KEY` | 카카오 디벨로퍼스 앱 → 앱 키 → REST API 키 |
| `APP_FRONTEND_URL` | `https://katsurank.kr` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://katsurank.kr` |
| `APP_COOKIE_DOMAIN` | `katsurank.kr` |
| `APP_COOKIE_SECURE` | `true` |
| `APP_COOKIE_SAME_SITE` | `Lax` |

> `PROD_SSH_KEY`는 **개인키** (`id_ed25519`, `.pub` 아닌 것). `-----BEGIN OPENSSH PRIVATE KEY-----`로 시작하는 전체 내용을 복사.

---

## 6단계. 첫 수동 배포 (CI/CD 연결 전 검증)

CI/CD 전에 수동으로 한 번 배포해서 서버 환경이 맞는지 확인한다.

### 6-1. 로컬에서 JAR 빌드

```bash
cd /Users/hongseungjun/justdoit/project/katsurank/backend
./gradlew bootJar -x test

# 빌드 결과 확인
ls build/libs/*.jar
# katsurank-0.0.1-SNAPSHOT.jar 이런 파일 생성됨
```

### 6-2. 서버로 JAR 업로드

```bash
# 로컬 터미널에서
scp build/libs/*.jar ubuntu@140.xxx.xxx.xxx:/opt/katsurank/app.jar
```

### 6-3. 서버에서 앱 시작

```bash
# 서버 SSH 접속
ssh ubuntu@140.xxx.xxx.xxx

# 서비스 시작
sudo systemctl start katsurank

# 로그 확인 (실시간)
sudo journalctl -u katsurank -f
```

정상 시작 로그에서 아래 메시지 확인:
```
Started KatsurankApplication in x.xxx seconds
```

Flyway 마이그레이션도 자동 실행됨:
```
Successfully applied 3 migrations to schema "public"
```

### 6-4. 로컬 헬스체크

```bash
# 서버에서 직접
curl http://localhost:8080/actuator/health
# {"status":"UP"} 뜨면 성공
```

### 6-5. 문제 발생 시 로그 확인

```bash
# 전체 로그 (최근 100줄)
sudo journalctl -u katsurank -n 100

# PostgreSQL 연결 실패 시
sudo -u postgres psql -c "\l"   # DB 목록 확인
sudo -u postgres psql -c "\du"  # 유저 목록 확인
```

---

## 7단계. Nginx 리버스 프록시 설정

### 7-1. 기본 사이트 비활성화

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 7-2. 카츠랭 사이트 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/katsurank
```

```nginx
server {
    listen 80;
    server_name katsurank.kr www.katsurank.kr;

    # ACME challenge (Let's Encrypt 인증용)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 나머지는 HTTPS로 리다이렉트
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name katsurank.kr www.katsurank.kr;

    # SSL 인증서 (Certbot이 자동으로 채워줌 — 지금은 주석)
    # ssl_certificate /etc/letsencrypt/live/katsurank.kr/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/katsurank.kr/privkey.pem;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # API 프록시
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 응답 타임아웃 (기본 60초)
        proxy_read_timeout 60s;
    }

    # OAuth 콜백 (Spring Security가 처리)
    location /login/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Actuator (외부에서 health만 허용)
    location /actuator/health {
        proxy_pass http://localhost:8080/actuator/health;
        proxy_set_header Host $host;
    }

    location /actuator/ {
        return 403;
    }
}
```

### 7-3. 사이트 활성화 + 문법 검사

```bash
sudo ln -s /etc/nginx/sites-available/katsurank /etc/nginx/sites-enabled/
sudo nginx -t
# "syntax is ok", "test is successful" 뜨면 OK

sudo systemctl reload nginx
```

---

## 8단계. SSL 인증서 (Let's Encrypt)

> 이 단계 전에 **DNS A 레코드가 서버 IP를 가리키고 있어야** 한다.
> CloudFlare → DNS → katsurank.kr A 레코드 → 서버 IP 입력.
> (CloudFlare Proxy: 일단 DNS Only로 설정. SSL 인증서 받은 후 Proxied로 변경)

### 8-1. DNS A 레코드 추가 (CloudFlare)

CloudFlare 대시보드 → DNS → Records → Add record:

| Type | Name | IPv4 address | Proxy status |
|---|---|---|---|
| A | `katsurank.kr` | 서버 Public IP | **DNS only** (회색 구름) |
| A | `www` | 서버 Public IP | **DNS only** (회색 구름) |

DNS 전파 확인:
```bash
# 로컬에서
dig katsurank.kr +short
# 서버 IP가 뜨면 OK (최대 수분~수십분 소요)
```

### 8-2. Certbot으로 SSL 인증서 발급

```bash
# 서버에서
sudo certbot --nginx -d katsurank.kr -d www.katsurank.kr
```

진행 중 질문:
- Email 입력 (Let's Encrypt 만료 알림용)
- Terms of Service: `A`
- Redirect HTTP to HTTPS: `2` (자동 리다이렉트 추가)

성공 시 Nginx 설정이 자동으로 SSL 인증서 경로로 업데이트됨.

자동 갱신 확인:
```bash
sudo certbot renew --dry-run
# Congratulations, all simulated renewals succeeded. 뜨면 OK
```

### 8-3. CloudFlare Proxy 활성화

DNS A 레코드에서 **Proxied** (주황 구름)으로 변경.
이후 트래픽이 CloudFlare를 통해 서버로 들어옴 → CDN + DDoS 기본 보호.

---

## 9단계. 카카오 디벨로퍼스 업데이트

[developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → 카츠랭 앱

### 9-1. 플랫폼 → 사이트 도메인 추가

`https://katsurank.kr` 추가

### 9-2. 카카오 로그인 → Redirect URI 추가

```
https://katsurank.kr/login/oauth2/code/kakao
```

### 9-3. 개인정보 처리방침 URL (필수)

배포 후 추가 필요: `https://katsurank.kr/privacy` (빈 페이지라도 OK)

---

## 10단계. CI/CD 자동 배포 테스트

GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)가 이미 생성되어 있다.

### 10-1. 트리거 테스트

```bash
# 로컬에서
cd /Users/hongseungjun/justdoit/project/katsurank
git add .github/workflows/deploy.yml
git commit -m "ci: 백엔드 자동 배포 파이프라인 추가"
git push origin main
```

### 10-2. Actions 실행 확인

GitHub → Actions 탭에서 워크플로우 실행 상태 확인.
각 단계 (Build JAR → Upload JAR → Restart service → Health check) 통과 여부 확인.

### 10-3. 종단 간 동작 확인

```bash
# 브라우저 또는 curl로
curl https://katsurank.kr/actuator/health
# {"status":"UP"} 뜨면 완료!

# 랭킹 API 테스트
curl https://katsurank.kr/api/v1/restaurants/ranking
```

---

## 모니터링 & 일상 운영

### 앱 상태 확인

```bash
# 서비스 상태
sudo systemctl status katsurank

# 실시간 로그
sudo journalctl -u katsurank -f

# 최근 100줄
sudo journalctl -u katsurank -n 100 --no-pager
```

### 수동으로 앱 재시작

```bash
sudo systemctl restart katsurank
```

### DB 직접 접속 (점검용)

```bash
psql -U katsurankapp -d katsurank -h localhost
# 비밀번호 입력
```

```sql
-- 세션 수 확인
SELECT COUNT(*) FROM spring_session;

-- 투표 수 상위 5개
SELECT name, vote_count FROM restaurants ORDER BY vote_count DESC LIMIT 5;
```

### Nginx 로그

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL 인증서 남은 기간

```bash
sudo certbot certificates
```

---

## 트러블슈팅

### 앱이 시작하지 않는 경우

```bash
sudo journalctl -u katsurank -n 200 --no-pager | grep -i "error\|exception\|failed"
```

**DB 연결 실패**: `/etc/katsurank/env`의 비밀번호/URL 확인
**포트 이미 사용 중**: `sudo lsof -i :8080`으로 프로세스 확인
**Flyway 마이그레이션 실패**: psql로 접속해서 `flyway_schema_history` 테이블 상태 확인

### 80/443 포트가 안 뚫리는 경우

OCI 콘솔 Security List만 열고 iptables를 빠뜨린 경우:
```bash
sudo iptables -L INPUT -n | grep -E "80|443"
# 규칙이 없으면 3-2 단계 다시 실행
```

### GitHub Actions 빌드 실패

- Java 버전 불일치: `build.gradle.kts`의 `jvmTarget`이 21인지 확인
- Gradle 빌드 실패: 로컬에서 `./gradlew bootJar -x test` 먼저 확인

### SSH 접속 거부

```bash
# 개인키 권한 확인 (400이어야 함)
ls -la ~/.ssh/id_ed25519
# -rw------- 이어야 함. 아니면:
chmod 400 ~/.ssh/id_ed25519
```

---

## 변경 이력

- **v0.1 (2026-06-28)**: 최초 작성. Oracle Cloud Free Tier + Nginx + GitHub Actions 기준.

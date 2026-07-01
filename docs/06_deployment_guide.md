# 카츠랭 — 배포 가이드 (백엔드)

- **버전**: v0.2
- **작성일**: 2026-07-01
- **대상**: AWS EC2 + Nginx + GitHub Actions CI/CD
- **전제**: API v1 로컬 테스트 완료, `main` 브랜치 안정

---

## 전체 흐름

```
[도메인 구매 (Gabia)]
     │
[Cloudflare 등록]          ← DNS + CDN + DDoS 방어
     │
[AWS EC2 인스턴스 생성]    ← 서버 프로비저닝
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

**총 소요 시간 예상**: 집중하면 3~5시간

---

## 0단계. 사전 준비 체크리스트

- [ ] AWS 계정 생성 (aws.amazon.com, 신용카드 필요 - Free Tier 12개월)
- [ ] Cloudflare 계정 생성 (cloudflare.com, 무료)
- [ ] 카카오 디벨로퍼스 앱 확인 (없으면 developers.kakao.com에서 생성)
- [ ] 로컬 SSH 키 확인: `ls ~/.ssh/id_ed25519.pub`
  - 없으면: `ssh-keygen -t ed25519 -C "katsurank-deploy"`
- [ ] 도메인 구매 예산 확인 (.kr 연 1~2만원, Gabia 기준)

---

## 1단계. 도메인 등록

**목적**: 이후의 모든 것(SSL, 카카오 OAuth)이 도메인 기준으로 설정되므로 제일 먼저.

### 1-1. Gabia에서 .kr 도메인 구매

1. [gabia.com](https://gabia.com) 접속 → `katsurank.kr` 검색
2. 장바구니 → 결제 (연 약 1~2만원)
3. 도메인 관리 → 네임서버 탭 진입 (아직 바꾸지 않아도 됨 — Cloudflare 등록 후 바꿀 것)

### 1-2. Cloudflare에 도메인 추가

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**
2. `katsurank.kr` 입력 → **Free 플랜** 선택
3. Cloudflare가 기존 DNS 레코드를 자동 스캔함 → Continue
4. Cloudflare가 **Nameserver 2개**를 알려줌 (예: `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
5. Gabia → 도메인 관리 → 네임서버 변경 → Cloudflare 네임서버 2개 입력 → 저장
6. 반영까지 최대 24시간 (보통 30분~2시간). Cloudflare 대시보드에서 "Active" 뜨면 완료.

> **A 레코드는 아직 추가하지 않는다.** 서버 IP 확정 후에 추가.

---

## 2단계. AWS EC2 — 인스턴스 생성

### 2-1. 리전 선택

AWS 콘솔 우상단 → **아시아 태평양 (서울) ap-northeast-2** 선택

### 2-2. EC2 인스턴스 생성

1. AWS 콘솔 → **EC2** → **Instances** → **Launch instances**

2. **Name**: `katsurank-prod`

3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type

4. **Instance type**: `t2.micro` (Free Tier eligible — 1 vCPU, 1 GB RAM)

5. **Key pair**:
   - **Create new key pair** 클릭
   - Name: `katsurank-key`
   - Type: ED25519
   - Format: `.pem`
   - 다운로드 후 안전한 곳에 보관

   ```bash
   # 다운받은 키 권한 설정
   chmod 400 ~/Downloads/katsurank-key.pem
   ```

6. **Network settings** → **Edit**:
   - VPC: 기본 VPC 사용
   - Subnet: 기본값 (ap-northeast-2a)
   - Auto-assign public IP: **Enable**
   - Firewall (Security groups): **Create security group**
     - Add inbound rules:
       | Type | Protocol | Port | Source |
       |---|---|---|---|
       | SSH | TCP | 22 | My IP |
       | HTTP | TCP | 80 | 0.0.0.0/0 |
       | HTTPS | TCP | 443 | 0.0.0.0/0 |

7. **Configure storage**: 기본값 (8 GB gp3) — Free Tier 30GB까지 무료

8. **Launch instance** 클릭 → 1~2분 후 Running 상태

### 2-3. Elastic IP 할당 (고정 IP)

EC2 재시작 시 IP가 바뀌지 않도록 고정 IP를 할당한다.

1. EC2 콘솔 좌측 → **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**
2. 생성된 Elastic IP 선택 → **Actions** → **Associate Elastic IP address**
3. Instance: `katsurank-prod` 선택 → **Associate**
4. **Elastic IP 주소 메모** (이후 DNS A 레코드에 사용)

> Free Tier: EC2에 연결된 Elastic IP는 무료. 인스턴스 중지 시 과금 주의.

### 2-4. SSH 접속 확인

```bash
ssh -i ~/Downloads/katsurank-key.pem ubuntu@<Elastic-IP>
```

처음 접속 시 "Are you sure you want to continue connecting?" → `yes`

---

## 3단계. 서버 초기 설정

### 3-1. 패키지 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

(5~10분 소요)

### 3-2. Java 21 설치

```bash
sudo apt install -y openjdk-21-jdk

# 확인
java -version
# 출력: openjdk version "21.x.x" ...
```

### 3-3. PostgreSQL 16 설치

```bash
sudo apt install -y postgresql postgresql-contrib

# 부팅 시 자동 시작 설정
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 확인
sudo systemctl status postgresql
# Active: active (running) 뜨면 OK
```

### 3-4. PostgreSQL DB + 유저 생성

```bash
sudo -u postgres psql
```

psql 프롬프트에서:
```sql
CREATE DATABASE katsurank;
CREATE USER katsurankapp WITH ENCRYPTED PASSWORD 'your-strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE katsurank TO katsurankapp;
\c katsurank
GRANT ALL ON SCHEMA public TO katsurankapp;
\q
```

> 비밀번호를 메모해 둔다. 다음 단계에서 환경변수에 사용.

### 3-5. Nginx 설치

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3-6. Certbot 설치 (SSL용)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3-7. 앱 디렉토리 생성

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
DATABASE_URL=jdbc:postgresql://localhost:5432/katsurank
DATABASE_USERNAME=katsurankapp
DATABASE_PASSWORD=your-strong-password-here

KAKAO_CLIENT_ID=카카오디벨로퍼스에서_복사
KAKAO_CLIENT_SECRET=카카오디벨로퍼스에서_복사
KAKAO_REST_API_KEY=카카오디벨로퍼스에서_복사

APP_FRONTEND_URL=https://katsurank.kr
APP_CORS_ALLOWED_ORIGINS=https://katsurank.kr
APP_COOKIE_DOMAIN=katsurank.kr
APP_COOKIE_SECURE=true
APP_COOKIE_SAME_SITE=Lax
```

저장: Ctrl+X → Y → Enter

```bash
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
| `PROD_HOST` | Elastic IP 주소 |
| `PROD_USER` | `ubuntu` |
| `PROD_SSH_KEY` | `katsurank-key.pem` 파일 전체 내용 |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/katsurank` |
| `DATABASE_USERNAME` | `katsurankapp` |
| `DATABASE_PASSWORD` | 3-4에서 설정한 비밀번호 |
| `KAKAO_CLIENT_ID` | 카카오 디벨로퍼스 앱 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 로그인 보안 → Client Secret |
| `KAKAO_REST_API_KEY` | 카카오 디벨로퍼스 REST API 키 |
| `APP_FRONTEND_URL` | `https://katsurank.kr` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://katsurank.kr` |
| `APP_COOKIE_DOMAIN` | `katsurank.kr` |
| `APP_COOKIE_SECURE` | `true` |
| `APP_COOKIE_SAME_SITE` | `Lax` |

> `PROD_SSH_KEY`는 `cat ~/Downloads/katsurank-key.pem`으로 복사. `-----BEGIN OPENSSH PRIVATE KEY-----`로 시작하는 전체 내용.

---

## 6단계. 첫 수동 배포 (CI/CD 연결 전 검증)

### 6-1. 로컬에서 JAR 빌드

```bash
cd /Users/hongseungjun/justdoit/project/katsurank/backend
./gradlew bootJar -x test

ls build/libs/*.jar
# katsurank-0.0.1-SNAPSHOT.jar 생성 확인
```

### 6-2. 서버로 JAR 업로드

```bash
scp -i ~/Downloads/katsurank-key.pem build/libs/*.jar ubuntu@<Elastic-IP>:/opt/katsurank/app.jar
```

### 6-3. 서버에서 앱 시작

```bash
ssh -i ~/Downloads/katsurank-key.pem ubuntu@<Elastic-IP>

sudo systemctl start katsurank
sudo journalctl -u katsurank -f
```

정상 시작 확인:
```
Started KatsurankApplication in x.xxx seconds
Successfully applied 3 migrations to schema "public"
```

### 6-4. 헬스체크

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"} 뜨면 성공
```

---

## 7단계. Nginx 리버스 프록시 설정

### 7-1. 기본 사이트 비활성화

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 7-2. API 문서(Swagger UI) Basic Auth 계정 생성

프론트 개발자에게 API 문서를 전달하기 위해 `/swagger-ui`, `/v3/api-docs` 경로만 Basic Auth로 막는다.
(계정 이름은 예시. 자격증명은 별도 채널로 프론트 개발자에게 전달)

```bash
sudo apt install -y apache2-utils   # htpasswd 명령
sudo htpasswd -c /etc/nginx/.htpasswd docs
```

### 7-3. 카츠랭 사이트 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/katsurank
```

```nginx
server {
    listen 80;
    server_name api.katsurank.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.katsurank.kr;

    # ssl_certificate /etc/letsencrypt/live/api.katsurank.kr/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.katsurank.kr/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # API 문서(Swagger UI) — 프론트 개발자 전달용. Basic Auth로 보호 (계정은 htpasswd로 생성, 자격증명은 별도 전달).
    location ~ ^/(swagger-ui|v3/api-docs) {
        auth_basic "katsurank API docs";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /login/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /actuator/health {
        proxy_pass http://localhost:8080/actuator/health;
        proxy_set_header Host $host;
    }

    location /actuator/ {
        return 403;
    }
}
```

### 7-4. 사이트 활성화

```bash
sudo ln -s /etc/nginx/sites-available/katsurank /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8단계. SSL 인증서 (Let's Encrypt)

### 8-1. DNS A 레코드 추가 (Cloudflare)

백엔드는 `api.katsurank.kr` 서브도메인을 쓴다 (프론트가 `katsurank.kr` 루트/www를 쓸 예정이므로 분리).

Cloudflare 대시보드 → DNS → Records → Add record:

| Type | Name | IPv4 address | Proxy status |
|---|---|---|---|
| A | `api` | Elastic IP | **DNS only** (회색 구름) |

DNS 전파 확인:
```bash
dig api.katsurank.kr +short
# Elastic IP가 뜨면 OK
```

### 8-2. Certbot으로 SSL 인증서 발급

```bash
sudo certbot --nginx -d api.katsurank.kr
```

### 8-3. Cloudflare Proxy 활성화

SSL 발급 완료 후 DNS A 레코드를 **Proxied** (주황 구름)으로 변경.

---

## 9단계. 카카오 디벨로퍼스 업데이트

[developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → 카츠랭 앱

- **플랫폼 → 사이트 도메인**: `https://katsurank.kr` 추가 (프론트 도메인 — 로그인 버튼이 뜨는 화면)
- **카카오 로그인 → Redirect URI**: `https://api.katsurank.kr/login/oauth2/code/kakao` 추가 (콜백은 백엔드가 처리하므로 백엔드 도메인)
- **개인정보 처리방침 URL**: `https://katsurank.kr/privacy` (배포 후 추가, 프론트 페이지)

---

## 10단계. CI/CD 자동 배포 테스트

`.github/workflows/deploy.yml`이 이미 생성되어 있다.

```bash
git push origin main
```

GitHub → Actions 탭에서 Build JAR → Upload JAR → Restart service → Health check 단계 확인.

```bash
curl https://api.katsurank.kr/actuator/health
# {"status":"UP"}

curl https://api.katsurank.kr/api/v1/ranking
```

---

## 모니터링 & 일상 운영

```bash
# 서비스 상태
sudo systemctl status katsurank

# 실시간 로그
sudo journalctl -u katsurank -f

# 최근 100줄
sudo journalctl -u katsurank -n 100 --no-pager

# 수동 재시작
sudo systemctl restart katsurank

# DB 직접 접속
psql -U katsurankapp -d katsurank -h localhost

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL 인증서 남은 기간
sudo certbot certificates
```

---

## 트러블슈팅

### 앱이 시작하지 않는 경우

```bash
sudo journalctl -u katsurank -n 200 --no-pager | grep -i "error\|exception\|failed"
```

- **DB 연결 실패**: `/etc/katsurank/env` 비밀번호/URL 확인
- **포트 이미 사용 중**: `sudo lsof -i :8080`
- **Flyway 실패**: psql에서 `flyway_schema_history` 테이블 확인

### SSH 접속 거부

```bash
# 키 파일 권한 확인
ls -la ~/Downloads/katsurank-key.pem
# -r-------- 이어야 함. 아니면:
chmod 400 ~/Downloads/katsurank-key.pem
```

### EC2 보안 그룹에서 포트가 막히는 경우

AWS 콘솔 → EC2 → Security Groups → `katsurank-prod` 보안 그룹 → Inbound rules 확인
80, 443, 22 포트가 열려 있는지 확인.

### GitHub Actions 빌드 실패

- Java 버전 불일치: `build.gradle.kts`의 `jvmTarget`이 21인지 확인
- 로컬에서 `./gradlew bootJar -x test` 먼저 확인

---

## 변경 이력

- **v0.1 (2026-06-28)**: 최초 작성. Oracle Cloud Free Tier 기준.
- **v0.2 (2026-07-01)**: AWS EC2 (t2.micro) + Cloudflare + Gabia 기준으로 전면 재작성.

# 카츠랭 — 1주차 작업 가이드

- **버전**: v0.1
- **목표**: 카카오 로그인 + 가게 CRUD (지도·랭킹·투표 X)
- **기간**: 7일, 하루 1~2시간

---

## 0. 시작 전 준비물

### 가입·발급 (10분)
- [ ] [GitHub](https://github.com) 계정 
- [ ] [카카오 디벨로퍼스](https://developers.kakao.com) 계정 + 앱 등록
  - 앱 이름: 카츠랭
  - 카카오 로그인 활성화 → Redirect URI 등록
  - REST API 키 메모 (카카오맵 로컬 API용)
- [ ] (도메인은 1주차에 필요 X, 출시 직전에 등록)

### 로컬 환경 (30분)
- [ ] Java 21 설치 (SDKMAN 추천: `sdk install java 21-tem`)
- [ ] Docker Desktop 설치 (PostgreSQL 띄우려고)
- [ ] IntelliJ IDEA Community (Spring 작업은 IntelliJ가 제일 편함)

---

## 1. 프로젝트 생성 (Day 1, 30분)

### 1.1 Spring Initializr

[start.spring.io](https://start.spring.io) 접속, 아래 설정:

| 항목 | 값 |
|---|---|
| Project | Gradle - Kotlin DSL |
| Language | Java |
| Spring Boot | 3.3.x 최신 |
| Group | com.katsurank |
| Artifact | katsurank |
| Name | katsurank |
| Package name | com.katsurank |
| Packaging | Jar |
| Java | 21 |

**의존성**:
- Spring Web
- Spring Data JPA
- Spring Security
- OAuth2 Client
- Thymeleaf
- PostgreSQL Driver
- Validation
- Lombok
- Spring Boot DevTools (개발 편의)

→ Generate 후 압축 풀고 IntelliJ로 열기.

### 1.2 패키지 구조

도메인 중심으로 단순하게:

```
com.katsurank
├── KatsurankApplication.java
├── auth          # 카카오 OAuth, 보안 설정, CustomOAuth2UserService
├── user          # User 엔티티/리포지토리/서비스
├── restaurant    # Restaurant 엔티티/리포지토리/서비스
├── vote          # (2주차) Vote 엔티티/리포지토리/서비스
├── kakao         # 카카오맵 API 클라이언트 (KakaoPlaceClient)
├── common        # 공통 응답·예외·유틸
└── config        # SecurityConfig, WebClientConfig 등
```

> 💡 1인 개발이라 헥사고날 아키텍처 같은 거 안 합니다. 단순함이 답.

### 1.3 PostgreSQL 띄우기

프로젝트 루트에 `docker-compose.yml` 복사 (`setup/docker-compose.yml` 참조). 그리고:

```bash
docker compose up -d
```

연결 확인:
```bash
docker exec -it katsurank-postgres psql -U katsurank -d katsurank
\dt   # 테이블 없음 (정상)
\q
```

### 1.4 application.yml 설정

`src/main/resources/application.yml`에 `setup/application.yml` 내용 복사.

환경변수 셋업 — IntelliJ Run Configuration에 추가:
```
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
KAKAO_REST_API_KEY=...
```

(또는 `.env` 파일 + dotenv-spring 라이브러리, 또는 IntelliJ EnvFile 플러그인)

### 1.5 첫 실행

```bash
./gradlew bootRun
```

브라우저 `http://localhost:8080` → 로그인 페이지 (Spring Security 기본 페이지)가 뜨면 성공.

### 1.6 GitHub 셋업

```bash
git init
git remote add origin git@github.com:USERNAME/katsurank.git
git add .
git commit -m "chore: 프로젝트 초기 셋업"
git push -u origin main
```

`.gitignore`에 추가 (Spring Initializr 기본 포함):
- `.env`
- `*.env`
- `.idea/`
- `build/`
- `out/`

---

## 2. Day 2 — 카카오 로그인 동작

### 2.1 SecurityConfig

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/restaurants/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .defaultSuccessUrl("/", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
            )
            .csrf(csrf -> csrf.disable());  // V1.1에 다시 켜기 — Thymeleaf+HTMX 흐름 안정화 후
        return http.build();
    }
}
```

> ⚠️ CSRF는 일단 끄지만, V1.1 안에 반드시 켭니다. 1주차 막판에 시간 남으면 그때 켜도 OK.

### 2.2 CustomOAuth2UserService

```java
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(req);
        Map<String, Object> attrs = oAuth2User.getAttributes();

        Long kakaoId = (Long) attrs.get("id");
        Map<String, Object> kakaoAccount = (Map<String, Object>) attrs.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        String nickname = (String) profile.get("nickname");
        String profileImage = (String) profile.get("profile_image_url");

        User user = userRepository.findByKakaoId(kakaoId)
            .map(existing -> existing.login(nickname, profileImage))
            .orElseGet(() -> userRepository.save(User.create(kakaoId, nickname, profileImage)));

        return new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            attrs,
            "id"
        );
    }
}
```

### 2.3 User 엔티티

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long kakaoId;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(length = 500)
    private String profileImage;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastLoginAt;

    private User(Long kakaoId, String nickname, String profileImage) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.createdAt = LocalDateTime.now();
        this.lastLoginAt = LocalDateTime.now();
    }

    public static User create(Long kakaoId, String nickname, String profileImage) {
        return new User(kakaoId, nickname, profileImage);
    }

    public User login(String nickname, String profileImage) {
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.lastLoginAt = LocalDateTime.now();
        return this;
    }
}
```

---

## 3. Day 4~5 — Restaurant + 카카오맵 API

자세한 코드는 본인이 짜는 게 학습에도 좋습니다. 다만 카카오맵 API 응답 형태만 미리 알려드림:

### 카카오 로컬 검색 응답 예시

```json
{
  "meta": { "total_count": 15, "pageable_count": 15, "is_end": true },
  "documents": [
    {
      "id": "26338954",
      "place_name": "명동돈가스",
      "category_name": "음식점 > 일식 > 돈까스,우동",
      "category_group_code": "FD6",
      "phone": "02-776-5300",
      "address_name": "서울 중구 명동9길 12",
      "road_address_name": "서울 중구 명동9길 12",
      "x": "126.984918",
      "y": "37.563749",
      "place_url": "http://place.map.kakao.com/26338954"
    }
  ]
}
```

→ `id`가 우리가 쓸 `kakaoPlaceId`. `x`가 경도(longitude), `y`가 위도(latitude). 이 순서 헷갈리기 쉬우니 주의!

### 카테고리 검증 로직

```java
@Component
@RequiredArgsConstructor
public class CategoryValidator {

    @Value("${katsurank.restaurant.allowed-category-keywords}")
    private List<String> allowedKeywords;

    public boolean isAllowed(String categoryName) {
        if (categoryName == null) return false;
        return allowedKeywords.stream().anyMatch(categoryName::contains);
    }
}
```

---

## 4. Day 7 — 회고

다음 질문에 답해보기:
- [ ] 일정대로 진행됐나? 늦었다면 어디서?
- [ ] 카카오 API 응답이 문서와 달랐던 부분은?
- [ ] 2주차 일정 (투표·랭킹) 조정 필요한가?
- [ ] 막힌 부분 (CSRF·OAuth 토큰 등)은 메모해두기

---

## 5. 다음 주 (2주차) 미리보기

- 투표 도메인 (Vote 엔티티, 표 이동 로직, 동시성)
- 랭킹 API (뷰포트 기반)
- 마이페이지 (현재 1순위 + 히스토리)
- 메인 페이지에 지도 + 사이드바 (실제 카카오맵 JS SDK 붙이기)

---

## 변경 이력

- **v0.1 (2026-05-11)**: 초안.

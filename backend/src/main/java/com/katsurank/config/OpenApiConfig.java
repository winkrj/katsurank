package com.katsurank.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI({@code /swagger-ui.html})에 노출되는 API 문서 메타 정보.
 *
 * <p>인증은 카카오 OAuth2 세션 쿠키(JWT 미사용)라 Swagger 의 표준 보안 스킴으로 표현하기 어렵다.
 * 대신 "Try it out"을 쓰려면 같은 브라우저 탭에서 먼저 {@code /oauth2/authorization/kakao}로
 * 로그인해 세션 쿠키를 받고, 변경 요청 전에는 {@code /api/v1/auth/csrf}로 CSRF 토큰을 받아
 * {@code X-XSRF-TOKEN} 헤더에 넣어야 한다는 안내를 description에 명시한다.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI katsurankOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("카츠랭 API")
                        .version("v1")
                        .description("""
                                서울 돈까스 1인 1표 랭킹 서비스 REST API.

                                인증: 카카오 OAuth2 + 세션 쿠키(JWT 미사용). 브라우저에서 \
                                `/oauth2/authorization/kakao`로 로그인하면 SESSION 쿠키가 내려간다.

                                CSRF: Double Submit Cookie 방식. POST/PATCH 등 변경 요청 전에 \
                                `GET /api/v1/auth/csrf`를 한 번 호출해 XSRF-TOKEN 쿠키를 받고, \
                                그 값을 `X-XSRF-TOKEN` 요청 헤더에 그대로 실어 보내야 한다.

                                Swagger UI의 "Try it out"으로 로그인이 필요한 API를 테스트하려면 \
                                같은 브라우저 탭에서 위 순서(로그인 → CSRF 토큰 발급)를 먼저 거쳐야 한다.
                                """));
    }
}

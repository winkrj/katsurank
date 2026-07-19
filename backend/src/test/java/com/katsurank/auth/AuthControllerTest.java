package com.katsurank.auth;

import com.katsurank.config.OAuth2FailureHandler;
import com.katsurank.config.OAuth2SuccessHandler;
import com.katsurank.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean CustomOAuth2UserService customOAuth2UserService;
    @MockitoBean OAuth2SuccessHandler successHandler;
    @MockitoBean OAuth2FailureHandler failureHandler;

    @Test
    @DisplayName("GET /api/v1/auth/me - 미인증 요청은 세션 쿠키를 만들지 않고 401")
    void meWithoutAuthDoesNotCreateSessionCookie() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().doesNotExist("SESSION"));
    }
}

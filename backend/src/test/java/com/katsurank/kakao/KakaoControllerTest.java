package com.katsurank.kakao;

import com.katsurank.auth.CustomOAuth2UserService;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KakaoController.class)
@Import(SecurityConfig.class)
class KakaoControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean KakaoLocalClient kakaoLocalClient;
    @MockitoBean CustomOAuth2UserService customOAuth2UserService;
    @MockitoBean OAuth2SuccessHandler successHandler;
    @MockitoBean OAuth2FailureHandler failureHandler;

    @Test
    @DisplayName("GET /api/v1/kakao-places/search — 인증 없이 200, offset/limit 기본값 0/15")
    void searchWithoutAuthDefaultsToFirstPage() throws Exception {
        when(kakaoLocalClient.searchByKeyword(eq("돈까스"), eq(0), eq(15)))
                .thenReturn(new KakaoSearchResult(
                        List.of(new KakaoPlace("p1", "명동돈까스", "서울 어딘가", "서울 어딘가로 1",
                                BigDecimal.valueOf(37.5), BigDecimal.valueOf(127.0),
                                "음식점 > 일식 > 돈까스", "02-1234-5678", "http://place.kakao.com/p1")),
                        30));

        mockMvc.perform(get("/api/v1/kakao-places/search").param("query", "돈까스"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offset").value(0))
                .andExpect(jsonPath("$.limit").value(15))
                .andExpect(jsonPath("$.total").value(30))
                .andExpect(jsonPath("$.items[0].kakaoPlaceId").value("p1"));

        verify(kakaoLocalClient).searchByKeyword("돈까스", 0, 15);
    }

    @Test
    @DisplayName("GET /api/v1/kakao-places/search?offset=15&limit=15 — 요청한 offset/limit을 그대로 전달·응답")
    void searchWithExplicitOffset() throws Exception {
        when(kakaoLocalClient.searchByKeyword(eq("돈까스"), anyInt(), anyInt()))
                .thenReturn(new KakaoSearchResult(List.of(), 30));

        mockMvc.perform(get("/api/v1/kakao-places/search")
                        .param("query", "돈까스").param("offset", "15").param("limit", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offset").value(15))
                .andExpect(jsonPath("$.limit").value(15));

        verify(kakaoLocalClient).searchByKeyword("돈까스", 15, 15);
    }

    @Test
    @DisplayName("GET /api/v1/kakao-places/search?offset=-1 — 범위 밖이면 400")
    void searchOffsetNegative() throws Exception {
        mockMvc.perform(get("/api/v1/kakao-places/search").param("query", "돈까스").param("offset", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/kakao-places/search?limit=46 — 카카오 정책상 최대 45건, 초과면 400")
    void searchLimitTooLarge() throws Exception {
        mockMvc.perform(get("/api/v1/kakao-places/search").param("query", "돈까스").param("limit", "46"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/kakao-places/search — query 누락 시 400")
    void searchMissingQuery() throws Exception {
        mockMvc.perform(get("/api/v1/kakao-places/search"))
                .andExpect(status().isBadRequest());
    }
}

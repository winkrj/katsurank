package com.katsurank.kakao;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 카카오 로컬 API 설정 (application.yml 의 {@code kakao.*}).
 *
 * @param restApiKey      카카오 디벨로퍼스 REST API 키 ({@code Authorization: KakaoAK ...})
 * @param localApiBaseUrl 로컬 API 베이스 URL (https://dapi.kakao.com)
 */
@ConfigurationProperties(prefix = "kakao")
public record KakaoProperties(String restApiKey, String localApiBaseUrl) {
}

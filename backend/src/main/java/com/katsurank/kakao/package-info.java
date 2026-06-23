/**
 * 카카오 연동 — 로컬 API(가게 검색) 프록시. HTTP 클라이언트는 RestClient.
 *
 * <p>가게 등록 시에만 호출하고 응답은 Caffeine 캐시({@code kakaoPlaceSearch})로 재사용한다.
 */
package com.katsurank.kakao;

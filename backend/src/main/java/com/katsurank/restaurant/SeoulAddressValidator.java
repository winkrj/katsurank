package com.katsurank.restaurant;

import com.katsurank.kakao.client.KakaoLocalClient;

/**
 * 서울 지역 검증 (랭킹이 서울 단일 랭킹이므로 서울 밖 가게는 등록 대상이 아니다).
 *
 * <p>지번({@code address}) 또는 도로명({@code roadAddress}) 주소 중 하나라도 "서울"로 시작하면 통과.
 * 카카오 검색 단계({@link com.katsurank.kakao.client.KakaoLocalClient})에서 이미 rect + 주소 접두어로 걸러내지만,
 * 등록 API를 직접 호출하는 경로(검색 프록시 우회)까지 막기 위해 등록 시점에도 동일하게 검증한다.
 */
public final class SeoulAddressValidator {

    private static final String SEOUL_PREFIX = "서울";

    private SeoulAddressValidator() {
    }

    public static boolean isSeoul(String address, String roadAddress) {
        if (address != null && address.startsWith(SEOUL_PREFIX)) {
            return true;
        }
        return roadAddress != null && roadAddress.startsWith(SEOUL_PREFIX);
    }
}

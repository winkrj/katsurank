package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/**
 * 서울 밖 주소로 가게 등록 시도 → 422.
 *
 * <p>거부된 가게는 영속하지 않는다({@link CategoryNotAllowedException}과 동일한 정책).
 */
public class RegionNotAllowedException extends ApiException {

    public RegionNotAllowedException(String address) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "REGION_NOT_ALLOWED",
                "서울 지역 가게만 등록할 수 있어요. (주소: " + (address == null ? "없음" : address) + ")");
    }
}

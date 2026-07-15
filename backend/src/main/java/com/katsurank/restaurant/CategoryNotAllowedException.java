package com.katsurank.restaurant;

import com.katsurank.common.web.ApiException;
import org.springframework.http.HttpStatus;

/**
 * 돈까스 카테고리(돈까스/돈가스/경양식)가 아닌 가게 등록 시도 → 422.
 *
 * <p>사용자 친화 정책: 거부된 가게는 영속하지 않는다(REJECTED 레코드를 남기지 않음).
 * 같은 {@code kakao_place_id} 를 영구히 막지 않으므로 카카오 카테고리 정정·정책 변경 후 재등록이 가능하다.
 */
public class CategoryNotAllowedException extends ApiException {

    public CategoryNotAllowedException(String kakaoCategory) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "CATEGORY_NOT_ALLOWED",
                "돈까스(돈가스·돈카츠)·경양식 카테고리만 등록할 수 있어요. (카카오 분류: "
                        + (kakaoCategory == null ? "없음" : kakaoCategory) + ")");
    }
}

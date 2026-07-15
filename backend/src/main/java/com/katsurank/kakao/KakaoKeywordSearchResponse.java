package com.katsurank.kakao;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

/**
 * 카카오 로컬 키워드 검색({@code /v2/local/search/keyword.json}) 응답 매핑.
 * 우리가 쓰는 필드만 추출하고 나머지는 무시한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KakaoKeywordSearchResponse(List<Document> documents, Meta meta) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Meta(
            @JsonProperty("total_count") int totalCount,
            @JsonProperty("pageable_count") int pageableCount,
            @JsonProperty("is_end") boolean isEnd) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Document(
            @JsonProperty("id") String id,
            @JsonProperty("place_name") String placeName,
            @JsonProperty("category_name") String categoryName,
            @JsonProperty("phone") String phone,
            @JsonProperty("address_name") String addressName,
            @JsonProperty("road_address_name") String roadAddressName,
            @JsonProperty("x") String x,
            @JsonProperty("y") String y,
            @JsonProperty("place_url") String placeUrl) {

        KakaoPlace toPlace() {
            return new KakaoPlace(
                    id,
                    placeName,
                    addressName,
                    roadAddressName,
                    toBigDecimal(y),   // y = 위도(latitude)
                    toBigDecimal(x),   // x = 경도(longitude)
                    categoryName,
                    phone,
                    placeUrl);
        }

        private static BigDecimal toBigDecimal(String value) {
            if (!StringUtils.hasText(value)) return null;
            try {
                return new BigDecimal(value);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
    }

    public List<KakaoPlace> toPlaces() {
        return documents == null ? List.of() : documents.stream().map(Document::toPlace).toList();
    }
}

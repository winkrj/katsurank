package com.katsurank.kakao;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class KakaoLocalClientTest {

    private static final String BASE_URL = "http://kakao.test";
    private static final String SEARCH_PATH = BASE_URL + "/v2/local/search/keyword.json";

    private RestClient.Builder newBuilder() {
        return RestClient.builder().baseUrl(BASE_URL);
    }

    @Test
    void page_파라미터를_카카오_요청에_그대로_전달한다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = new KakaoLocalClient(builder.build());

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("query", "tonkatsu"))
                .andExpect(queryParam("page", "2"))
                .andExpect(queryParam("size", "15"))
                .andExpect(queryParam("category_group_code", "FD6"))
                .andRespond(withSuccess("""
                        {"documents":[],"meta":{"total_count":30,"pageable_count":30,"is_end":false}}
                        """, MediaType.APPLICATION_JSON));

        client.searchByKeyword("tonkatsu", 2);

        server.verify();
    }

    @Test
    void pageable_count_기준으로_totalPages를_계산한다() {
        assertTotalPages(0, 0);
        assertTotalPages(1, 1);
        assertTotalPages(15, 1);
        assertTotalPages(20, 2);
        assertTotalPages(45, 3);
    }

    private void assertTotalPages(int pageableCount, int expectedTotalPages) {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = new KakaoLocalClient(builder.build());

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {"documents":[],"meta":{"total_count":%d,"pageable_count":%d,"is_end":true}}
                        """.formatted(pageableCount, pageableCount), MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 1);

        assertThat(result.totalPages()).isEqualTo(expectedTotalPages);
    }

    @Test
    void meta가_없는_응답도_안전하게_처리한다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = new KakaoLocalClient(builder.build());

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {"documents":[]}
                        """, MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 1);

        assertThat(result.places()).isEmpty();
        assertThat(result.totalPages()).isZero();
        assertThat(result.isEnd()).isTrue();
    }
}

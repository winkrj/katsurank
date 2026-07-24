package com.katsurank.kakao;

import com.katsurank.kakao.dto.KakaoSearchResult;

import com.katsurank.kakao.dto.KakaoPlace;

import com.katsurank.kakao.client.KakaoLocalClient;

import com.katsurank.kakao.client.KakaoRawPageFetcher;

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

    private KakaoLocalClient newClient(RestClient.Builder builder) {
        return new KakaoLocalClient(new KakaoRawPageFetcher(builder.build()));
    }

    private String place(String id, String name, String category, String address) {
        return """
                {"id":"%s","place_name":"%s","category_name":"%s","address_name":"%s","x":"127.0","y":"37.5"}
                """.formatted(id, name, category, address);
    }

    @Test
    void 클라이언트가_요청한_offset과_무관하게_원본은_1페이지부터_순서대로_요청한다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("query", "tonkatsu"))
                .andExpect(queryParam("page", "1"))
                .andExpect(queryParam("size", "15"))
                .andExpect(queryParam("category_group_code", "FD6"))
                .andExpect(queryParam("rect", "126.734086,37.413294,127.269311,37.715133"))
                .andRespond(withSuccess("""
                        {"documents":[],"meta":{"total_count":0,"pageable_count":0,"is_end":true}}
                        """, MediaType.APPLICATION_JSON));

        client.searchByKeyword("tonkatsu", 15, 15);

        server.verify();
    }

    @Test
    void 카카오가_isEnd라고_할때까지만_원본_페이지를_이어서_요청한다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "1"))
                .andRespond(withSuccess("""
                        {"documents":[%s],"meta":{"total_count":20,"pageable_count":20,"is_end":false}}
                        """.formatted(place("1", "동경돈까스", "음식점 > 일식 > 돈까스,우동", "서울 마포구 망원동")),
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "2"))
                .andRespond(withSuccess("""
                        {"documents":[%s],"meta":{"total_count":20,"pageable_count":20,"is_end":true}}
                        """.formatted(place("2", "강남돈까스", "음식점 > 일식 > 돈까스,우동", "서울 강남구 역삼동")),
                        MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 0, 15);

        assertThat(result.places()).extracting(KakaoPlace::name).containsExactly("동경돈까스", "강남돈까스");
        server.verify();
    }

    @Test
    void 여러_원본_페이지에_흩어진_결과를_모아_요청받은_limit_단위로_다시_나눈다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        StringBuilder page1Docs = new StringBuilder();
        for (int i = 1; i <= 15; i++) {
            if (i > 1) page1Docs.append(",");
            page1Docs.append(place(String.valueOf(i), "돈까스" + i, "음식점 > 일식 > 돈까스,우동", "서울 마포구 망원동"));
        }
        StringBuilder page2Docs = new StringBuilder();
        for (int i = 16; i <= 20; i++) {
            if (i > 16) page2Docs.append(",");
            page2Docs.append(place(String.valueOf(i), "돈까스" + i, "음식점 > 일식 > 돈까스,우동", "서울 마포구 망원동"));
        }

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "1"))
                .andRespond(withSuccess(
                        "{\"documents\":[" + page1Docs + "],\"meta\":{\"total_count\":20,\"pageable_count\":20,\"is_end\":false}}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "2"))
                .andRespond(withSuccess(
                        "{\"documents\":[" + page2Docs + "],\"meta\":{\"total_count\":20,\"pageable_count\":20,\"is_end\":true}}",
                        MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 0, 15);

        assertThat(result.places()).hasSize(15);
        assertThat(result.places().get(0).name()).isEqualTo("돈까스1");
        assertThat(result.totalCount()).isEqualTo(20);
    }

    @Test
    void offset을_주면_필터링된_결과의_다음_구간을_돌려준다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        StringBuilder page1Docs = new StringBuilder();
        for (int i = 1; i <= 15; i++) {
            if (i > 1) page1Docs.append(",");
            page1Docs.append(place(String.valueOf(i), "돈까스" + i, "음식점 > 일식 > 돈까스,우동", "서울 마포구 망원동"));
        }
        StringBuilder page2Docs = new StringBuilder();
        for (int i = 16; i <= 20; i++) {
            if (i > 16) page2Docs.append(",");
            page2Docs.append(place(String.valueOf(i), "돈까스" + i, "음식점 > 일식 > 돈까스,우동", "서울 마포구 망원동"));
        }

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "1"))
                .andRespond(withSuccess(
                        "{\"documents\":[" + page1Docs + "],\"meta\":{\"total_count\":20,\"pageable_count\":20,\"is_end\":false}}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andExpect(queryParam("page", "2"))
                .andRespond(withSuccess(
                        "{\"documents\":[" + page2Docs + "],\"meta\":{\"total_count\":20,\"pageable_count\":20,\"is_end\":true}}",
                        MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 15, 15);

        assertThat(result.places()).hasSize(5);
        assertThat(result.places().get(0).name()).isEqualTo("돈까스16");
        assertThat(result.totalCount()).isEqualTo(20);
    }

    @Test
    void 돈까스와_무관한_카테고리_이름은_걸러낸다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {
                          "documents": [
                            {"id":"1","place_name":"동경돈까스","category_name":"음식점 > 일식 > 돈까스,우동","address_name":"서울 마포구 망원동","x":"127.0","y":"37.5"},
                            {"id":"2","place_name":"청담수 경양식돈까스","category_name":"음식점 > 양식","address_name":"서울 서초구 서초동","x":"127.0","y":"37.5"},
                            {"id":"3","place_name":"마초 스테이크","category_name":"음식점 > 양식 > 스테이크,립","address_name":"서울 강남구 논현동","x":"127.0","y":"37.5"}
                          ],
                          "meta": {"total_count":3,"pageable_count":3,"is_end":true}
                        }
                        """, MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 0, 15);

        assertThat(result.places())
                .extracting(KakaoPlace::name)
                .containsExactly("동경돈까스", "청담수 경양식돈까스");
    }

    @Test
    void 서울이_아닌_주소는_걸러낸다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {
                          "documents": [
                            {"id":"1","place_name":"서울돈까스","category_name":"음식점 > 일식 > 돈까스,우동","address_name":"서울 마포구 망원동","x":"127.0","y":"37.5"},
                            {"id":"2","place_name":"부산돈까스","category_name":"음식점 > 일식 > 돈까스,우동","address_name":"부산 금정구 장전동","x":"129.0","y":"35.2"}
                          ],
                          "meta": {"total_count":2,"pageable_count":2,"is_end":true}
                        }
                        """, MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 0, 15);

        assertThat(result.places())
                .extracting(KakaoPlace::name)
                .containsExactly("서울돈까스");
    }

    @Test
    void totalCount는_카카오_원본이_아니라_필터링_후_실제_반환_개수다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {
                          "documents": [
                            {"id":"1","place_name":"동경돈까스","category_name":"음식점 > 일식 > 돈까스,우동","address_name":"서울 마포구 망원동","x":"127.0","y":"37.5"},
                            {"id":"2","place_name":"강남맛집식당","category_name":"음식점 > 한식","address_name":"서울 강남구 논현동","x":"127.0","y":"37.5"}
                          ],
                          "meta": {"total_count":24018,"pageable_count":45,"is_end":true}
                        }
                        """, MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("강남 맛집", 0, 15);

        assertThat(result.places()).hasSize(1);
        assertThat(result.totalCount()).isEqualTo(1);
    }

    @Test
    void meta가_없는_응답도_안전하게_처리한다() {
        RestClient.Builder builder = newBuilder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        KakaoLocalClient client = newClient(builder);

        server.expect(requestTo(startsWith(SEARCH_PATH)))
                .andRespond(withSuccess("""
                        {"documents":[]}
                        """, MediaType.APPLICATION_JSON));

        KakaoSearchResult result = client.searchByKeyword("돈까스", 0, 15);

        assertThat(result.places()).isEmpty();
        assertThat(result.totalCount()).isZero();
    }
}

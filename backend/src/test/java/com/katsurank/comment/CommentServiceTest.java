package com.katsurank.comment;

import com.katsurank.comment.exception.CommentAlreadyExistsException;
import com.katsurank.comment.exception.CommentForbiddenException;
import com.katsurank.comment.exception.CommentNotFoundException;
import com.katsurank.comment.exception.RestaurantNotCommentableException;
import com.katsurank.comment.repository.CommentRepository;
import com.katsurank.comment.service.CommentService;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.support.CleanUp;
import com.katsurank.support.TestFixtures;
import com.katsurank.user.User;
import com.katsurank.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Sql(statements = {
        CleanUp.SQL_DELETE_COMMENTS,
        CleanUp.SQL_DELETE_RANKING_SNAPSHOTS,
        CleanUp.SQL_CLEAR_VOTES,
        CleanUp.SQL_DELETE_VOTES,
        CleanUp.SQL_DELETE_RESTAURANTS
})
class CommentServiceTest {

    @Autowired CommentService commentService;
    @Autowired CommentRepository commentRepository;
    @Autowired RestaurantRepository restaurantRepository;
    @Autowired UserRepository userRepository;

    @Test
    @DisplayName("ACTIVE 가게에 댓글을 작성하면 양끝 공백을 제거하고 작성자 정보를 반환한다")
    void createComment() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);

        var response = commentService.create(restaurant.getId(), user.getId(), "  맛있어요  ");

        assertThat(response.content()).isEqualTo("맛있어요");
        assertThat(response.author().id()).isEqualTo(user.getId());
        assertThat(response.createdAt()).isNotNull();
        assertThat(commentRepository.existsByRestaurantIdAndUserId(restaurant.getId(), user.getId())).isTrue();
    }

    @Test
    @DisplayName("같은 사용자는 같은 가게에 댓글을 하나만 작성할 수 있다")
    void rejectDuplicateComment() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);
        commentService.create(restaurant.getId(), user.getId(), "첫 댓글");

        assertThatThrownBy(() -> commentService.create(restaurant.getId(), user.getId(), "두 번째 댓글"))
                .isInstanceOf(CommentAlreadyExistsException.class);
    }

    @Test
    @DisplayName("댓글 목록은 최신 작성순이며 현재 작성자 프로필과 페이지 정보를 반환한다")
    void listCommentsWithCurrentAuthorProfile() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User first = TestFixtures.createUser(userRepository);
        User second = TestFixtures.createUser(userRepository);
        commentService.create(restaurant.getId(), first.getId(), "첫 댓글");
        commentService.create(restaurant.getId(), second.getId(), "둘째 댓글");

        first.login("바뀐닉네임", "https://profile/new", Instant.now());
        userRepository.saveAndFlush(first);

        var page = commentService.getComments(restaurant.getId(), 0, 1);

        assertThat(page.items()).singleElement().satisfies(item ->
                assertThat(item.author().id()).isEqualTo(second.getId()));
        assertThat(page.total()).isEqualTo(2);
        assertThat(page.offset()).isZero();
        assertThat(page.limit()).isEqualTo(1);

        var all = commentService.getComments(restaurant.getId(), 0, 20);
        assertThat(all.items()).filteredOn(item -> item.author().id().equals(first.getId()))
                .singleElement().satisfies(item -> {
                    assertThat(item.author().nickname()).isEqualTo("바뀐닉네임");
                    assertThat(item.author().profileImage()).isEqualTo("https://profile/new");
                });
    }

    @Test
    @DisplayName("댓글 페이지 범위를 검증한다")
    void validatePage() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);

        assertThatThrownBy(() -> commentService.getComments(restaurant.getId(), -1, 20))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> commentService.getComments(restaurant.getId(), 0, 101))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("작성자만 자신의 댓글을 수정할 수 있다")
    void updateOnlyByOwner() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User owner = TestFixtures.createUser(userRepository);
        User other = TestFixtures.createUser(userRepository);
        var comment = commentService.create(restaurant.getId(), owner.getId(), "수정 전");

        assertThatThrownBy(() ->
                commentService.update(restaurant.getId(), comment.id(), other.getId(), "가로채기"))
                .isInstanceOf(CommentForbiddenException.class);

        var updated = commentService.update(restaurant.getId(), comment.id(), owner.getId(), " 수정 후 ");
        assertThat(updated.content()).isEqualTo("수정 후");
    }

    @Test
    @DisplayName("URL의 가게와 댓글의 가게가 다르면 댓글 없음으로 처리한다")
    void rejectPathMismatch() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        Restaurant otherRestaurant = TestFixtures.createRestaurant(restaurantRepository);
        User owner = TestFixtures.createUser(userRepository);
        var comment = commentService.create(restaurant.getId(), owner.getId(), "댓글");

        assertThatThrownBy(() ->
                commentService.update(otherRestaurant.getId(), comment.id(), owner.getId(), "수정"))
                .isInstanceOf(CommentNotFoundException.class);
    }

    @Test
    @DisplayName("폐업 가게에는 댓글을 작성하거나 수정할 수 없다")
    void rejectCreateAndUpdateOnClosedRestaurant() {
        Restaurant closed = TestFixtures.createClosedRestaurant(restaurantRepository, "폐업가게");
        User user = TestFixtures.createUser(userRepository);

        assertThatThrownBy(() -> commentService.create(closed.getId(), user.getId(), "댓글"))
                .isInstanceOf(RestaurantNotCommentableException.class);

        Restaurant active = TestFixtures.createRestaurant(restaurantRepository);
        var comment = commentService.create(active.getId(), user.getId(), "기존 댓글");
        active.close(Instant.now());
        restaurantRepository.saveAndFlush(active);

        assertThatThrownBy(() -> commentService.update(active.getId(), comment.id(), user.getId(), "수정"))
                .isInstanceOf(RestaurantNotCommentableException.class);
    }

    @Test
    @DisplayName("폐업 후에도 본인 댓글을 삭제할 수 있고 ACTIVE 가게에서는 다시 작성할 수 있다")
    void deleteAndRecreate() {
        Restaurant restaurant = TestFixtures.createRestaurant(restaurantRepository);
        User user = TestFixtures.createUser(userRepository);
        var comment = commentService.create(restaurant.getId(), user.getId(), "삭제할 댓글");

        commentService.delete(restaurant.getId(), comment.id(), user.getId());
        commentRepository.flush();
        assertThat(commentRepository.existsByRestaurantIdAndUserId(restaurant.getId(), user.getId())).isFalse();

        var recreated = commentService.create(restaurant.getId(), user.getId(), "새 댓글");
        assertThat(recreated.id()).isNotEqualTo(comment.id());

        restaurant.close(Instant.now());
        restaurantRepository.saveAndFlush(restaurant);
        commentService.delete(restaurant.getId(), recreated.id(), user.getId());
        commentRepository.flush();
        assertThat(commentRepository.existsById(recreated.id())).isFalse();
    }
}

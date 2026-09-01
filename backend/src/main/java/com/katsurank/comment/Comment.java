package com.katsurank.comment;

import com.katsurank.comment.exception.CommentForbiddenException;
import com.katsurank.common.domain.BaseTimeEntity;
import com.katsurank.common.domain.EntityIdentity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 가게별 사용자 1인 1댓글. 삭제는 사용자 요청 시 hard delete 한다. */
@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false, updatable = false)
    private Long restaurantId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "content", length = 500, nullable = false)
    private String content;

    private Comment(Long restaurantId, Long userId, String content) {
        this.restaurantId = restaurantId;
        this.userId = userId;
        this.content = normalize(content);
    }

    public static Comment write(Long restaurantId, Long userId, String content) {
        return new Comment(restaurantId, userId, content);
    }

    /** 작성자 본인만 댓글 내용을 변경할 수 있다. */
    public void updateBy(Long requesterId, String content) {
        verifyOwner(requesterId);
        this.content = normalize(content);
    }

    public void verifyOwner(Long requesterId) {
        if (!userId.equals(requesterId)) {
            throw new CommentForbiddenException(id);
        }
    }

    private static String normalize(String content) {
        if (content == null) {
            throw new IllegalArgumentException("댓글 내용은 필수입니다.");
        }
        String trimmed = content.strip();
        if (trimmed.isEmpty() || trimmed.length() > 500) {
            throw new IllegalArgumentException("댓글은 1자 이상 500자 이하여야 합니다.");
        }
        return trimmed;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (other == null || EntityIdentity.effectiveClass(this) != EntityIdentity.effectiveClass(other)) return false;
        Comment comment = (Comment) other;
        return id != null && id.equals(comment.getId());
    }

    @Override
    public int hashCode() {
        return EntityIdentity.effectiveClass(this).hashCode();
    }
}

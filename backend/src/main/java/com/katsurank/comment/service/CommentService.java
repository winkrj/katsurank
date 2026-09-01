package com.katsurank.comment.service;

import com.katsurank.comment.Comment;
import com.katsurank.comment.dto.CommentResponse;
import com.katsurank.comment.exception.CommentAlreadyExistsException;
import com.katsurank.comment.exception.CommentNotFoundException;
import com.katsurank.comment.exception.RestaurantNotCommentableException;
import com.katsurank.comment.repository.CommentQueryRepository;
import com.katsurank.comment.repository.CommentRepository;
import com.katsurank.common.web.PageResponse;
import com.katsurank.restaurant.Restaurant;
import com.katsurank.restaurant.RestaurantStatus;
import com.katsurank.restaurant.exception.RestaurantNotFoundException;
import com.katsurank.restaurant.repository.RestaurantRepository;
import com.katsurank.user.User;
import com.katsurank.user.exception.UserNotFoundException;
import com.katsurank.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private static final int MAX_LIMIT = 100;

    private final CommentRepository commentRepository;
    private final CommentQueryRepository commentQueryRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          CommentQueryRepository commentQueryRepository,
                          RestaurantRepository restaurantRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.commentQueryRepository = commentQueryRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getComments(Long restaurantId, int offset, int limit) {
        validatePage(offset, limit);
        ensureRestaurantExists(restaurantId);

        List<CommentResponse> items = commentQueryRepository.findByRestaurantId(restaurantId, offset, limit)
                .stream()
                .map(row -> row.toResponse())
                .toList();
        return new PageResponse<>(
                items,
                commentQueryRepository.countByRestaurantId(restaurantId),
                offset,
                limit);
    }

    @Transactional
    public CommentResponse create(Long restaurantId, Long userId, String content) {
        Restaurant restaurant = getRestaurantForUpdate(restaurantId);
        ensureCommentable(restaurant);
        if (commentRepository.existsByRestaurantIdAndUserId(restaurantId, userId)) {
            throw new CommentAlreadyExistsException(restaurantId, userId);
        }
        User author = getUser(userId);

        try {
            Comment saved = commentRepository.saveAndFlush(Comment.write(restaurantId, userId, content));
            return CommentResponse.from(saved, author);
        } catch (DataIntegrityViolationException exception) {
            throw new CommentAlreadyExistsException(restaurantId, userId);
        }
    }

    @Transactional
    public CommentResponse update(Long restaurantId, Long commentId, Long userId, String content) {
        Comment comment = getComment(restaurantId, commentId);
        comment.verifyOwner(userId);
        ensureCommentable(getRestaurantForUpdate(restaurantId));
        comment.updateBy(userId, content);

        Comment saved = commentRepository.saveAndFlush(comment);
        return CommentResponse.from(saved, getUser(userId));
    }

    @Transactional
    public void delete(Long restaurantId, Long commentId, Long userId) {
        Comment comment = getComment(restaurantId, commentId);
        comment.verifyOwner(userId);
        commentRepository.delete(comment);
    }

    private Comment getComment(Long restaurantId, Long commentId) {
        return commentRepository.findByIdAndRestaurantId(commentId, restaurantId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
    }

    private Restaurant getRestaurantForUpdate(Long restaurantId) {
        return restaurantRepository.findByIdForUpdate(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId));
    }

    private void ensureRestaurantExists(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new RestaurantNotFoundException(restaurantId);
        }
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private void ensureCommentable(Restaurant restaurant) {
        if (restaurant.getStatus() != RestaurantStatus.ACTIVE) {
            throw new RestaurantNotCommentableException(restaurant.getId());
        }
    }

    private void validatePage(int offset, int limit) {
        if (offset < 0) {
            throw new IllegalArgumentException("offset은 0 이상이어야 합니다.");
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new IllegalArgumentException("limit은 1 이상 100 이하여야 합니다.");
        }
    }
}

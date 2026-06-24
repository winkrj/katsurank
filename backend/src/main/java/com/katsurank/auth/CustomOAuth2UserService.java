package com.katsurank.auth;

import com.katsurank.user.User;
import com.katsurank.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 카카오 인증 콜백에서 호출된다. 카카오 프로필을 받아 User 를 upsert 하고,
 * 세션에 저장될 {@link AuthPrincipal} 을 돌려준다.
 *
 * <p>신규면 가입, 기존이면 최신 프로필로 갱신하고 마지막 로그인 시각을 기록한다(1인 1계정 = kakaoId UNIQUE).
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = delegate.loadUser(userRequest);
        KakaoUserInfo info = KakaoUserInfo.from(oAuth2User.getAttributes());

        User user = userRepository.findByKakaoId(info.kakaoId())
                .map(existing -> {
                    existing.login(info.nickname(), info.profileImage());
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("신규 사용자 가입 kakaoId={}", info.kakaoId());
                    try {
                        return userRepository.saveAndFlush(User.register(info.kakaoId(), info.nickname(), info.profileImage()));
                    } catch (DataIntegrityViolationException ex) {
                        return userRepository.findByKakaoId(info.kakaoId()).orElseThrow();
                    }
                });

        return new AuthPrincipal(user.getId(), user.getKakaoId(), user.getNickname(), user.getProfileImage());
    }
}

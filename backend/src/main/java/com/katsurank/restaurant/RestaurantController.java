package com.katsurank.restaurant;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 가게 API. 등록은 로그인 필요(SecurityConfig 의 anyRequest authenticated), 단건 조회는 공개(GET permitAll).
 */
@RestController
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    public ResponseEntity<RestaurantResponse> register(@Valid @RequestBody RestaurantRegisterRequest request,
                                                       @LoginUser AuthPrincipal principal) {
        RestaurantResponse response = restaurantService.register(request, principal.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public RestaurantResponse get(@PathVariable Long id) {
        return restaurantService.getById(id);
    }
}

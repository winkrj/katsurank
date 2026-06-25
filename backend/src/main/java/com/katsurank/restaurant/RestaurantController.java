package com.katsurank.restaurant;

import com.katsurank.auth.AuthPrincipal;
import com.katsurank.auth.LoginUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 가게 API. 등록은 로그인 필요, 조회/검색은 공개(GET permitAll).
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

    @GetMapping("/search")
    public List<RestaurantSearchResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "20") int limit) {
        if (q == null || q.isBlank()) {
            throw new MissingQueryException();
        }
        return restaurantService.search(q, limit);
    }

    @PatchMapping("/{id}/close")
    public CloseResponse close(@PathVariable Long id) {
        return restaurantService.close(id);
    }

    @PatchMapping("/{id}/relocate")
    public RelocateResponse relocate(@PathVariable Long id,
                                     @Valid @RequestBody RelocateRequest request) {
        return restaurantService.relocate(id, request);
    }
}

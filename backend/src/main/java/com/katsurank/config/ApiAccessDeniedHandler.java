package com.katsurank.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;

public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException, ServletException {
        ApiSecurityErrorWriter.write(response, HttpServletResponse.SC_FORBIDDEN,
                "ACCESS_DENIED", "요청 권한이 없거나 CSRF 토큰이 올바르지 않습니다.");
    }
}

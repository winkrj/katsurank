package com.katsurank.config;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

final class ApiSecurityErrorWriter {

    private ApiSecurityErrorWriter() {
    }

    static void write(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("""
                {"success":false,"data":null,"error":{"code":"%s","message":"%s"}}
                """.formatted(code, message).trim());
    }
}

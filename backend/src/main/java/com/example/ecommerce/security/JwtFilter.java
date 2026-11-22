package com.example.ecommerce.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parse(authorization.substring(7));
                request.setAttribute("authUserId", claims.getSubject());
                request.setAttribute("authRole", claims.get("role", String.class));
            } catch (Exception ex) {
                response.setStatus(401);
                response.setContentType("application/problem+json");
                response.getWriter().write("{\"type\":\"https://httpstatuses.com/401\",\"title\":\"UNAUTHORIZED\",\"status\":401,\"detail\":\"Token invalid or expired\",\"instance\":\""
                    + request.getRequestURI() + "\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}

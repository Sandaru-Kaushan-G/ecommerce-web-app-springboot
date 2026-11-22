package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.InviteDtos;
import com.example.ecommerce.service.InviteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
public class InviteController {
    private final InviteService invites;

    @PostMapping("/accept")
    public ResponseEntity<AuthResponse> accept(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invites.accept(body));
    }

    @GetMapping
    public List<InviteDtos.InviteResponse> list(HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        return invites.list();
    }

    @PostMapping
    public ResponseEntity<InviteDtos.CreateInviteResponse> create(@RequestBody Map<String, Object> body,
                                                                   HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        String userId = ProductController.requireAuth(request);
        String email = body.get("email") == null ? null : body.get("email").toString();
        String role = body.get("role") == null ? "staff" : body.get("role").toString();
        return ResponseEntity.status(HttpStatus.CREATED).body(invites.create(email, role, userId));
    }
}

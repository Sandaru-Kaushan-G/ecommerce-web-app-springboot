package com.example.ecommerce.controller;

import com.example.ecommerce.model.User;
import com.example.ecommerce.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService admin;

    @GetMapping("/metrics")
    public Map<String, Object> metrics(HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        return admin.metrics();
    }

    @GetMapping("/users")
    public List<User> users(HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        return admin.listUsers();
    }

    @PatchMapping("/users/{id}/role")
    public User updateRole(@PathVariable String id, @RequestBody Map<String, Object> body,
                           HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        String currentUserId = ProductController.requireAuth(request);
        String role = body.get("role") == null ? null : body.get("role").toString();
        Boolean isActive = body.get("isActive") == null ? null : Boolean.valueOf(body.get("isActive").toString());
        return admin.updateUserRole(id, role, isActive, currentUserId);
    }
}

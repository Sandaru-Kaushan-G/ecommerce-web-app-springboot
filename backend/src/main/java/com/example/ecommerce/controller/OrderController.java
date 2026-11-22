package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CheckoutRequest;
import com.example.ecommerce.dto.OrderResponse;
import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orders;

    @GetMapping
    public java.util.List<OrderResponse> list(HttpServletRequest request) {
        ProductController.requireRole(request, "staff", "admin");
        return orders.list();
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@RequestBody CheckoutRequest requestBody,
                                                          HttpServletRequest request) {
        ProductController.requireRole(request, "customer");
        String userId = ProductController.requireAuth(request);
        OrderResponse order = orders.checkout(userId, requestBody);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "order", order));
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body,
                                             HttpServletRequest request) {
        ProductController.requireRole(request, "staff", "admin");
        String status = body.get("status") == null ? null : body.get("status").toString();
        if (status == null) throw new ApiException("Invalid order status", 400, "VALIDATION_ERROR");
        return Map.of("success", true, "updated", orders.updateStatus(id, status));
    }
}

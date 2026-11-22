package com.example.ecommerce.controller;

import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService products;

    @GetMapping
    public List<Product> list() {
        return products.list();
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product, HttpServletRequest request) {
        requireRole(request, "staff", "admin");
        return ResponseEntity.status(HttpStatus.CREATED).body(products.create(product));
    }

    @PatchMapping("/{id}")
    public Product update(@PathVariable String id, @RequestBody Product product, HttpServletRequest request) {
        String role = requireRole(request, "staff", "admin");
        return products.update(id, product, "staff".equals(role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest request) {
        requireRole(request, "admin");
        products.delete(id);
        return ResponseEntity.noContent().build();
    }

    static String requireAuth(HttpServletRequest request) {
        Object id = request.getAttribute("authUserId");
        if (id == null) throw new ApiException("Unauthorized, token missing", 401, "UNAUTHORIZED");
        return id.toString();
    }

    static String requireRole(HttpServletRequest request, String... roles) {
        String userId = requireAuth(request);
        Object roleObject = request.getAttribute("authRole");
        String role = roleObject == null ? "" : roleObject.toString();
        for (String allowed : roles) if (allowed.equals(role)) return role;
        throw new ApiException("Forbidden", 403, "FORBIDDEN");
    }
}

package com.example.ecommerce.controller;

import com.example.ecommerce.model.Coupon;
import com.example.ecommerce.service.CouponService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {
    private final CouponService coupons;

    @GetMapping
    public List<Coupon> list(HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        return coupons.list();
    }

    @PostMapping
    public ResponseEntity<Coupon> create(@RequestBody Coupon coupon, HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        return ResponseEntity.status(HttpStatus.CREATED).body(coupons.create(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest request) {
        ProductController.requireRole(request, "admin");
        coupons.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.example.ecommerce.service;

import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Coupon;
import com.example.ecommerce.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DiscountService {
    private final CouponRepository coupons;

    public double apply(String code, double subtotal) {
        if (code == null || code.isBlank()) return 0;
        Coupon coupon = coupons.findByCode(code.trim().toUpperCase())
            .orElseThrow(() -> new ApiException("Coupon code is invalid", 400, "VALIDATION_ERROR"));
        if (coupon.getValidUntil() == null || coupon.getValidUntil().isBefore(Instant.now())) {
            throw new ApiException("Coupon has expired", 400, "VALIDATION_ERROR");
        }
        if (subtotal < coupon.getMinOrderValue()) {
            throw new ApiException("Minimum order value is " + coupon.getMinOrderValue(), 400, "VALIDATION_ERROR");
        }
        double discount = "PERCENTAGE".equals(coupon.getDiscountType())
            ? subtotal * coupon.getDiscountValue() / 100
            : "FLAT".equals(coupon.getDiscountType()) ? coupon.getDiscountValue() : -1;
        if (discount < 0) throw new ApiException("Coupon discount type is not supported", 400, "VALIDATION_ERROR");
        return Math.min(subtotal, Math.max(0, discount));
    }
}

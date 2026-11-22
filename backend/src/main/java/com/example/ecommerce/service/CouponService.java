package com.example.ecommerce.service;

import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Coupon;
import com.example.ecommerce.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {
    private final CouponRepository coupons;

    public List<Coupon> list() {
        return coupons.findAll(Sort.by(Sort.Direction.ASC, "validUntil"));
    }

    public Coupon create(Coupon coupon) {
        String code = coupon.getCode() == null ? null : coupon.getCode().trim().toUpperCase();
        if (code == null || code.isBlank() || !List.of("PERCENTAGE", "FLAT").contains(coupon.getDiscountType())) {
            throw new ApiException("Code and a valid discount type are required", 400, "VALIDATION_ERROR");
        }
        if (!Double.isFinite(coupon.getDiscountValue()) || coupon.getDiscountValue() <= 0) {
            throw new ApiException("Discount value must be greater than zero", 400, "VALIDATION_ERROR");
        }
        if ("PERCENTAGE".equals(coupon.getDiscountType()) && coupon.getDiscountValue() > 100) {
            throw new ApiException("Percentage discount cannot exceed 100", 400, "VALIDATION_ERROR");
        }
        if (coupon.getValidUntil() == null || !coupon.getValidUntil().isAfter(Instant.now())) {
            throw new ApiException("Valid until must be a future date", 400, "VALIDATION_ERROR");
        }
        coupon.setCode(code);
        return coupons.save(coupon);
    }

    public void delete(String id) {
        if (!coupons.existsById(id)) throw new ApiException("Coupon not found", 404, "NOT_FOUND");
        coupons.deleteById(id);
    }
}

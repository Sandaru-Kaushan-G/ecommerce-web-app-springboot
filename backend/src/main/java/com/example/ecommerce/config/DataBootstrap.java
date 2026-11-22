package com.example.ecommerce.config;

import com.example.ecommerce.model.Coupon;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final ProductRepository products;
    private final CouponRepository coupons;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.name:}")
    private String adminName;
    @Value("${app.super-admin.email:}")
    private String adminEmail;
    @Value("${app.super-admin.password:}")
    private String adminPassword;
    @Value("${app.seed-on-startup:false}")
    private boolean seedOnStartup;

    public DataBootstrap(UserRepository users, ProductRepository products, CouponRepository coupons,
                         PasswordEncoder passwordEncoder) {
        this.users = users;
        this.products = products;
        this.coupons = coupons;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!adminName.isBlank() && !adminEmail.isBlank() && !adminPassword.isBlank()) {
            String email = adminEmail.trim().toLowerCase();
            if (users.findByEmail(email).isEmpty()) {
                User admin = new User();
                admin.setName(adminName.trim());
                admin.setEmail(email);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole("admin");
                admin.setVerified(true);
                admin.setActive(true);
                users.save(admin);
                System.out.println("[Bootstrap] Super Admin created successfully.");
            }
        } else {
            System.out.println("[Bootstrap] Super Admin variables are not fully configured; skipping bootstrap.");
        }

        if (seedOnStartup && products.count() == 0) {
            Product mouse = new Product();
            mouse.setTitle("Wireless Gaming Mouse"); mouse.setPrice(4500); mouse.setStock(15);
            mouse.setCategory("Electronics"); mouse.setImageUrl("https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400");
            products.save(mouse);
            Product keyboard = new Product();
            keyboard.setTitle("Mechanical Keyboard RGB"); keyboard.setPrice(12500); keyboard.setStock(8);
            keyboard.setCategory("Electronics"); keyboard.setImageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400");
            products.save(keyboard);
            Product hoodie = new Product();
            hoodie.setTitle("Casual Cotton Hoodie"); hoodie.setPrice(3800); hoodie.setStock(20);
            hoodie.setCategory("Clothing"); hoodie.setImageUrl("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400");
            products.save(hoodie);
        }
        if (seedOnStartup && coupons.count() == 0) {
            Coupon save10 = new Coupon();
            save10.setCode("SAVE10"); save10.setDiscountType("PERCENTAGE"); save10.setDiscountValue(10);
            save10.setMinOrderValue(2000); save10.setValidUntil(Instant.parse("2030-01-01T00:00:00Z"));
            coupons.save(save10);
            Coupon flat500 = new Coupon();
            flat500.setCode("FLAT500"); flat500.setDiscountType("FLAT"); flat500.setDiscountValue(500);
            flat500.setMinOrderValue(3000); flat500.setValidUntil(Instant.parse("2030-01-01T00:00:00Z"));
            coupons.save(flat500);
        }
    }
}

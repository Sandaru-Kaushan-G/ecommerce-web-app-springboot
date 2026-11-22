package com.example.ecommerce.service;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.RegisterRequest;
import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String register(RegisterRequest request) {
        if (request.getName() == null || request.getEmail() == null || request.getPassword() == null
            || request.getName().isBlank() || request.getEmail().isBlank() || request.getPassword().isBlank()) {
            throw new ApiException("Name, email, and password are required", 400, "VALIDATION_ERROR");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (users.findByEmail(email).isPresent()) {
            throw new ApiException("User already exists", 409, "CONFLICT");
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("customer");
        user.setVerified(false);
        user.setActive(true);
        User saved = users.save(user);
        return saved.getId();
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new ApiException("Email and password are required", 400, "VALIDATION_ERROR");
        }
        User user = users.findByEmail(request.getEmail().trim().toLowerCase())
            .orElse(null);
        if (user == null || !user.isActive() || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid email or password", 401, "UNAUTHORIZED");
        }
        return new AuthResponse(jwtService.generate(user.getId(), user.getRole()), user.getId(),
            user.getEmail(), user.getRole(), user.getName());
    }

    public AuthResponse tokenResponse(User user) {
        return new AuthResponse(jwtService.generate(user.getId(), user.getRole()), user.getId(),
            user.getEmail(), user.getRole(), user.getName());
    }
}

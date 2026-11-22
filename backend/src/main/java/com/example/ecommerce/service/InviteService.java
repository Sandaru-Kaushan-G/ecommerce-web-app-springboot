package com.example.ecommerce.service;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.InviteDtos;
import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.StaffInvite;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.StaffInviteRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InviteService {
    private final StaffInviteRepository invites;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public InviteDtos.CreateInviteResponse create(String email, String role, String invitedBy) {
        email = email == null ? "" : email.trim().toLowerCase();
        role = role == null ? "staff" : role;
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ApiException("A valid email address is required", 400, "VALIDATION_ERROR");
        }
        if (!List.of("staff", "admin").contains(role)) {
            throw new ApiException("Invite role must be staff or admin", 400, "VALIDATION_ERROR");
        }
        if (users.findByEmail(email).isPresent()) {
            throw new ApiException("A user with this email already exists", 409, "CONFLICT");
        }
        if (invites.findFirstByEmailAndUsedFalseAndExpiresAtAfter(email, Instant.now()).isPresent()) {
            throw new ApiException("An active invitation already exists for this email", 409, "CONFLICT");
        }

        byte[] tokenBytes = new byte[32];
        new SecureRandom().nextBytes(tokenBytes);
        String rawToken = HexFormat.of().formatHex(tokenBytes);
        StaffInvite invite = new StaffInvite();
        invite.setEmail(email);
        invite.setRole(role);
        invite.setTokenHash(hash(rawToken));
        invite.setExpiresAt(Instant.now().plus(48, ChronoUnit.HOURS));
        invite.setUsed(false);
        invite.setInvitedBy(invitedBy);
        StaffInvite saved = invites.save(invite);
        String link = frontendUrl + "/accept-invite?token=" + rawToken;
        System.out.println("[Invite] Staff invitation generated for " + email + ": " + link);
        return new InviteDtos.CreateInviteResponse(toResponse(saved), link);
    }

    public List<InviteDtos.InviteResponse> list() {
        return invites.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .limit(100)
            .map(this::toResponse)
            .toList();
    }

    public AuthResponse accept(Map<String, Object> body) {
        String token = (String) body.get("token");
        String name = body.get("name") == null ? null : ((String) body.get("name")).trim();
        String password = (String) body.get("password");
        if (token == null || name == null || name.isBlank() || password == null) {
            throw new ApiException("Invitation token, name, and password are required", 400, "VALIDATION_ERROR");
        }
        if (password.length() < 8) {
            throw new ApiException("Password must be at least 8 characters", 400, "VALIDATION_ERROR");
        }
        StaffInvite invite = invites.findByTokenHashAndUsedFalse(hash(token))
            .orElseThrow(() -> new ApiException("Invitation is invalid or has already been accepted", 404, "NOT_FOUND"));
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Invitation has expired", 400, "VALIDATION_ERROR");
        }
        if (users.findByEmail(invite.getEmail()).isPresent()) {
            throw new ApiException("A user with this email already exists", 409, "CONFLICT");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(invite.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(invite.getRole());
        user.setVerified(true);
        user.setActive(true);
        User saved = users.save(user);
        invite.setUsed(true);
        invites.save(invite);
        return new AuthResponse(jwtService.generate(saved.getId(), saved.getRole()), saved.getId(),
            saved.getEmail(), saved.getRole(), saved.getName());
    }

    private InviteDtos.InviteResponse toResponse(StaffInvite invite) {
        String status = invite.isUsed() ? "Accepted"
            : (invite.getExpiresAt().isBefore(Instant.now()) ? "Expired" : "Pending");
        return new InviteDtos.InviteResponse(invite.getId(), invite.getEmail(), invite.getRole(),
            invite.getExpiresAt(), invite.isUsed(), invite.getCreatedAt(), status);
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}

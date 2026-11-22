package com.example.ecommerce.repository;

import com.example.ecommerce.model.StaffInvite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StaffInviteRepository extends MongoRepository<StaffInvite, String> {
    Optional<StaffInvite> findByTokenHashAndUsedFalse(String tokenHash);
    Optional<StaffInvite> findFirstByEmailAndUsedFalseAndExpiresAtAfter(String email, java.time.Instant expiresAt);
}

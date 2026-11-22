package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

public class InviteDtos {
    @Data
    @AllArgsConstructor
    public static class CreateInviteResponse {
        private InviteResponse invite;
        private String inviteLink;
    }

    @Data
    @AllArgsConstructor
    public static class InviteResponse {
        private String id;
        private String email;
        private String role;
        private Instant expiresAt;
        private boolean used;
        private Instant createdAt;
        private String status;
    }
}

package com.example.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("staffinvites")
public class StaffInvite {
    @Id
    @JsonProperty("_id")
    private String id;
    private String email;
    private String role;
    private String tokenHash;
    private Instant expiresAt;
    private boolean used;
    private String invitedBy;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}

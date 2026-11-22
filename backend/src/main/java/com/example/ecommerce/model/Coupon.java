package com.example.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.example.ecommerce.config.FlexibleInstantDeserializer;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("coupons")
public class Coupon {
    @Id
    @JsonProperty("_id")
    private String id;
    @Indexed(unique = true)
    private String code;
    private String discountType;
    private double discountValue;
    private double minOrderValue;
    @JsonDeserialize(using = FlexibleInstantDeserializer.class)
    private Instant validUntil;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}

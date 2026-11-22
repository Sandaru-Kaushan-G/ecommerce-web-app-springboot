package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class OrderResponse {
    @JsonProperty("_id")
    private String id;
    private Map<String, Object> user;
    private Map<String, Object> shippingDetails;
    private List<Map<String, Object>> items;
    private double subtotal;
    private double discountAmount;
    private double total;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}

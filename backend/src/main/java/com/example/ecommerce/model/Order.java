package com.example.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document("orders")
public class Order {
    @Id
    @JsonProperty("_id")
    private String id;
    @DocumentReference(lazy = false)
    private User user;
    private ShippingDetails shippingDetails;
    private List<OrderItem> items = new ArrayList<>();
    private double subtotal;
    private double discountAmount;
    private double total;
    private String status = "Pending";
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    @Data
    public static class ShippingDetails {
        private String fullName;
        private String address;
        private String city;
        private String postalCode;
        private String phone;
    }

    @Data
    public static class OrderItem {
        @DocumentReference(lazy = false)
        private Product product;
        private int quantity;
        private double unitPrice;
    }
}

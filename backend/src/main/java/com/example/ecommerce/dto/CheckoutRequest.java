package com.example.ecommerce.dto;

import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    private List<CheckoutItem> items;
    private String couponCode;
    private ShippingDetails shippingDetails;

    @Data
    public static class CheckoutItem {
        private String productId;
        private Integer quantity;
    }

    @Data
    public static class ShippingDetails {
        private String fullName;
        private String address;
        private String city;
        private String postalCode;
        private String phone;
    }
}

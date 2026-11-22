package com.example.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("products")
public class Product {
    @Id
    @JsonProperty("_id")
    private String id;
    private String title;
    private double price;
    private int stock;
    private String category;
    private String imageUrl = "";
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}

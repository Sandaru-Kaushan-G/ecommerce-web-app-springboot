package com.example.ecommerce.service;

import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository products;

    public List<Product> list() {
        return products.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Product create(Product product) {
        validate(product);
        if (product.getImageUrl() == null) product.setImageUrl("");
        return products.save(product);
    }

    public Product update(String id, Product updates, boolean staffOnly) {
        Product product = products.findById(id)
            .orElseThrow(() -> new ApiException("Product not found", 404, "NOT_FOUND"));
        if (staffOnly) {
            product.setStock(updates.getStock());
        } else {
            if (updates.getTitle() != null) product.setTitle(updates.getTitle());
            if (updates.getPrice() >= 0) product.setPrice(updates.getPrice());
            if (updates.getCategory() != null) product.setCategory(updates.getCategory());
            if (updates.getImageUrl() != null) product.setImageUrl(updates.getImageUrl());
            product.setStock(updates.getStock());
        }
        validate(product);
        return products.save(product);
    }

    public void delete(String id) {
        if (!products.existsById(id)) throw new ApiException("Product not found", 404, "NOT_FOUND");
        products.deleteById(id);
    }

    private void validate(Product product) {
        if (product.getTitle() == null || product.getTitle().isBlank()
            || product.getCategory() == null || product.getCategory().isBlank()
            || product.getPrice() < 0 || product.getStock() < 0) {
            throw new ApiException("Title, category, non-negative price, and non-negative stock are required",
                400, "VALIDATION_ERROR");
        }
    }
}

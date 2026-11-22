package com.example.ecommerce.service;

import com.example.ecommerce.dto.CheckoutRequest;
import com.example.ecommerce.dto.OrderResponse;
import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;
    private final DiscountService discountService;
    private final MongoTemplate mongoTemplate;

    public OrderResponse checkout(String userId, CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ApiException("At least one item is required to place an order", 400, "VALIDATION_ERROR");
        }
        User user = users.findById(userId)
            .orElseThrow(() -> new ApiException("Unauthorized", 401, "UNAUTHORIZED"));
        double subtotal = 0;
        List<Order.OrderItem> verifiedItems = new ArrayList<>();
        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new ApiException("Item quantities must be positive whole numbers", 400, "VALIDATION_ERROR");
            }
            Product product = products.findById(item.getProductId())
                .orElseThrow(() -> new ApiException("Product not found: " + item.getProductId(), 404, "NOT_FOUND"));
            subtotal += product.getPrice() * item.getQuantity();
            Order.OrderItem orderItem = new Order.OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(item.getQuantity());
            orderItem.setUnitPrice(product.getPrice());
            verifiedItems.add(orderItem);
        }

        double discount = discountService.apply(request.getCouponCode(), subtotal);
        for (Order.OrderItem item : verifiedItems) {
            Product updated = mongoTemplate.findAndModify(
                new Query(Criteria.where("_id").is(item.getProduct().getId()).and("stock").gte(item.getQuantity())),
                new Update().inc("stock", -item.getQuantity()),
                FindAndModifyOptions.options().returnNew(true),
                Product.class);
            if (updated == null) {
                throw new ApiException("Not enough stock for product " + item.getProduct().getId(), 409, "CONFLICT");
            }
        }

        Order order = new Order();
        order.setUser(user);
        if (request.getShippingDetails() != null) {
            Order.ShippingDetails shipping = new Order.ShippingDetails();
            CheckoutRequest.ShippingDetails source = request.getShippingDetails();
            shipping.setFullName(source.getFullName());
            shipping.setAddress(source.getAddress());
            shipping.setCity(source.getCity());
            shipping.setPostalCode(source.getPostalCode());
            shipping.setPhone(source.getPhone());
            order.setShippingDetails(shipping);
        }
        order.setItems(verifiedItems);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setTotal(Math.max(0, subtotal - discount));
        order.setStatus("Pending");
        return toResponse(orders.save(order));
    }

    public List<OrderResponse> list() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OrderResponse updateStatus(String id, String status) {
        if (!List.of("Pending", "Processing", "Shipped", "Delivered", "Cancelled").contains(status)) {
            throw new ApiException("Invalid order status", 400, "VALIDATION_ERROR");
        }
        Order order = orders.findById(id).orElseThrow(() -> new ApiException("Order not found", 404, "NOT_FOUND"));
        order.setStatus(status);
        return toResponse(orders.save(order));
    }

    public OrderResponse toResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        if (order.getUser() != null) {
            response.setUser(new LinkedHashMap<>(Map.of(
                "_id", order.getUser().getId(),
                "name", order.getUser().getName(),
                "email", order.getUser().getEmail())));
        }
        if (order.getShippingDetails() != null) {
            response.setShippingDetails(new LinkedHashMap<>(Map.of(
                "fullName", value(order.getShippingDetails().getFullName()),
                "address", value(order.getShippingDetails().getAddress()),
                "city", value(order.getShippingDetails().getCity()),
                "postalCode", value(order.getShippingDetails().getPostalCode()),
                "phone", value(order.getShippingDetails().getPhone()))));
        }
        List<Map<String, Object>> items = new ArrayList<>();
        for (Order.OrderItem item : order.getItems()) {
            Map<String, Object> itemMap = new LinkedHashMap<>();
            if (item.getProduct() != null) {
                itemMap.put("product", Map.of(
                    "_id", item.getProduct().getId(),
                    "title", item.getProduct().getTitle(),
                    "imageUrl", value(item.getProduct().getImageUrl())));
            }
            itemMap.put("quantity", item.getQuantity());
            itemMap.put("unitPrice", item.getUnitPrice());
            items.add(itemMap);
        }
        response.setItems(items);
        response.setSubtotal(order.getSubtotal());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setTotal(order.getTotal());
        response.setStatus(order.getStatus());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());
        return response;
    }

    private String value(String value) { return value == null ? "" : value; }
}

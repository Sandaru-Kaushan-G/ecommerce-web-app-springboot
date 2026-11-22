package com.example.ecommerce.service;

import com.example.ecommerce.dto.OrderResponse;
import com.example.ecommerce.exception.ApiException;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;
    private final OrderService orderService;

    public Map<String, Object> metrics() {
        List<Order> all = orders.findAll();
        double revenue = all.stream().filter(order -> !"Cancelled".equals(order.getStatus()))
            .mapToDouble(Order::getTotal).sum();
        long pending = all.stream().filter(order ->
            List.of("Pending", "Processing").contains(order.getStatus())).count();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", revenue);
        result.put("totalOrders", all.size());
        result.put("pendingOrders", pending);
        result.put("lowStockCount", products.countByStockLessThanEqual(5));
        result.put("totalCustomers", users.countByRole("customer"));
        result.put("recentOrders", orders.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .limit(5)
            .map(orderService::toResponse)
            .toList());
        return result;
    }

    public List<User> listUsers() {
        return users.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public User updateUserRole(String id, String role, Boolean isActive, String currentUserId) {
        User user = users.findById(id).orElseThrow(() -> new ApiException("User not found", 404, "NOT_FOUND"));
        if (role != null && !List.of("customer", "staff", "admin").contains(role)) {
            throw new ApiException("Invalid user role", 400, "VALIDATION_ERROR");
        }
        if (id.equals(currentUserId) && Boolean.FALSE.equals(isActive)) {
            throw new ApiException("You cannot deactivate your own account", 409, "CONFLICT");
        }
        if (role == null && isActive == null) {
            throw new ApiException("Provide a role or isActive value", 400, "VALIDATION_ERROR");
        }
        if (role != null) user.setRole(role);
        if (isActive != null) user.setActive(isActive);
        return users.save(user);
    }
}

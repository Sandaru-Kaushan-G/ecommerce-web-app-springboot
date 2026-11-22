package com.example.ecommerce.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetails> handle(ApiException ex, HttpServletRequest request) {
        ProblemDetails body = new ProblemDetails(
            "https://httpstatuses.com/" + ex.getStatus(), ex.getCode(), ex.getStatus(),
            ex.getMessage(), request.getRequestURI(), null);
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetails> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage()).toList();
        ProblemDetails body = new ProblemDetails(
            "https://httpstatuses.com/400", "VALIDATION_ERROR", 400,
            "Request validation failed", request.getRequestURI(), errors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ProblemDetails> handleDuplicate(DuplicateKeyException ex, HttpServletRequest request) {
        ProblemDetails body = new ProblemDetails(
            "https://httpstatuses.com/409", "DUPLICATE_RESOURCE", 409,
            "A resource with that value already exists", request.getRequestURI(), null);
        return ResponseEntity.status(409).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetails> handleNotFound(NoResourceFoundException ex, HttpServletRequest request) {
        ProblemDetails body = new ProblemDetails(
            "https://httpstatuses.com/404", "NOT_FOUND", 404,
            "Route not found: " + request.getMethod() + " " + request.getRequestURI(),
            request.getRequestURI(), null);
        return ResponseEntity.status(404).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleUnexpected(Exception ex, HttpServletRequest request) {
        ex.printStackTrace();
        ProblemDetails body = new ProblemDetails(
            "https://httpstatuses.com/500", "INTERNAL_ERROR", 500,
            "An unexpected error occurred", request.getRequestURI(), null);
        return ResponseEntity.status(500).body(body);
    }
}

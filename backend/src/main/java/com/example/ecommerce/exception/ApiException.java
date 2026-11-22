package com.example.ecommerce.exception;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {
    private final int status;
    private final String code;

    public ApiException(String message, int status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

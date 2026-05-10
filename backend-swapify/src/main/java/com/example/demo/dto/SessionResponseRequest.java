package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionResponseRequest {
    @NotNull(message = "Response type is required")
    private String responseType;

    private String responseMessage;
}
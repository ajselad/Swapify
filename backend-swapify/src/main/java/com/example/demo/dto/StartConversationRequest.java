package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StartConversationRequest {
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @Size(max = 2000, message = "Initial message cannot exceed 2000 characters")
    private String initialMessage;

    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;
}
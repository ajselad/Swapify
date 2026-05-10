package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class SendMessageRequest {
    @Size(max = 5000, message = "Message content cannot exceed 5000 characters")
    private String content;

    private Long replyToMessageId;


    private List<MultipartFile> attachments;

    public boolean isValid() {
        return (content != null && !content.trim().isEmpty()) ||
                (attachments != null && !attachments.isEmpty());
    }
}
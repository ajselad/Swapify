package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String content;
    private String messageType;
    private String messageStatus;
    private Boolean isEdited;
    private LocalDateTime editedAt;
    private Long replyToMessageId;
    private List<MessageAttachmentDto> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
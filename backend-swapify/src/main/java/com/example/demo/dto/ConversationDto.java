package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConversationDto {
    private Long id;
    private String conversationType;
    private String title;
    private ParticipantDto otherParticipant;
    private MessageDto lastMessage;
    private Integer unreadCount;
    private Boolean hasUnread;
    private Boolean isActive;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
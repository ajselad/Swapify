package com.example.demo.dto;

import lombok.Data;

@Data
public class ConversationStatsDto {
    private Integer totalConversations;
    private Integer unreadConversations;
    private Integer totalUnreadMessages;
    private Integer activeConversations;
    private Integer archivedConversations;
}

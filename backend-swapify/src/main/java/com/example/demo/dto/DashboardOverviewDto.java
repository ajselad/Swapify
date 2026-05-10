package com.example.demo.dto;

import lombok.Data;

@Data
public class DashboardOverviewDto {
    private Integer recentMessagesCount;
    private Integer unreadMessagesCount;
    private Integer upcomingSessionsCount;
    private Integer activeConversationsCount;
}
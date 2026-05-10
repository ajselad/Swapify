package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageStatsDto {
    private Integer totalMessagesSent;
    private Integer totalMessagesReceived;
    private Integer messagesLastWeek;
    private Integer messagesLastMonth;
    private LocalDateTime lastMessageSent;
    private LocalDateTime lastMessageReceived;
}
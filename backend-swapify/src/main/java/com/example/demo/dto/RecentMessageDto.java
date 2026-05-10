package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RecentMessageDto {
    private Long conversationId;
    private String participantName;
    private String participantAvatar;
    private String messageContent;
    private LocalDateTime timestamp;
    private Boolean isUnread;
    private Boolean isFromCurrentUser;
}

package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpcomingSessionDto {
    private Long id;
    private String skillName;
    private LocalDateTime scheduledDateTime;
    private Integer duration;
    private String status;
    private String otherParticipantName;
    private String otherParticipantAvatar;
    private String userRole;
    private String title;
    private String meetingType;
    private String meetingLink;
    private String meetingLocation;
}
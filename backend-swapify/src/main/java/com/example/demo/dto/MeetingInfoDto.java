package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MeetingInfoDto {
    private Long sessionId;
    private String meetingLink;
    private String meetingLocation;
    private String meetingNotes;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private Boolean canJoin;
    private String joinInstructions;
    private Integer minutesUntilStart;
    private String otherParticipantName;
}
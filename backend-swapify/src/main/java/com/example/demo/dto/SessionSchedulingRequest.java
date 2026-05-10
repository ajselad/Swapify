package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionSchedulingRequest {
    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;

    private String meetingLink;
    private String meetingLocation;
    private String meetingNotes;
}
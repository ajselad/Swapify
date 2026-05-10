package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

@Data
public class SessionBookingRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;

    @NotNull(message = "Skill ID is required")
    private Long skillId;

    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    @Max(value = 240, message = "Duration cannot exceed 240 minutes")
    private Integer durationMinutes = 60;

    @NotNull(message = "Meeting type is required")
    private String meetingType = "VIDEO_CALL";

    private String studentMessage;
}
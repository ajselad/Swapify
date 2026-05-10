package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionDto {
    private Long id;
    private String title;
    private String description;

    private Long studentId;
    private Long teacherId;

    private UserProfileSummaryDto student;
    private UserProfileSummaryDto teacher;
    private SkillDto skill;
    private String status;
    private String meetingType;
    private Integer durationMinutes;
    private String studentMessage;
    private String teacherResponse;


    private LocalDateTime scheduledAt;
    private String meetingLink;
    private String meetingLocation;
    private String meetingNotes;


    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;


    private Integer studentRating;
    private Integer teacherRating;
    private String studentReview;
    private String teacherReview;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    private String statusDisplayText;
    private String otherParticipantName;
    private UserProfileSummaryDto otherParticipant;
    private Boolean needsAction;
    private Boolean canSchedule;
    private Boolean canCancel;
    private Boolean canComplete;
    private Boolean canRate;
    private Boolean canJoinMeeting;
    private Integer minutesUntilStart;
}
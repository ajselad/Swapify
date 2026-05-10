package com.example.demo.dto;

import lombok.Data;

@Data
public class SessionStatsDto {
    private Integer totalSessions;
    private Integer pendingSessions;
    private Integer acceptedSessions;
    private Integer scheduledSessions;
    private Integer completedSessions;
    private Integer cancelledSessions;
    private Integer upcomingSessions;
    private Integer sessionsAsStudent;
    private Integer sessionsAsTeacher;
    private Integer sessionsNeedingRating;
    private Double averageRatingReceived;
    private Double averageRatingGiven;

    public SessionStatsDto() {
        this.totalSessions = 0;
        this.pendingSessions = 0;
        this.acceptedSessions = 0;
        this.scheduledSessions = 0;
        this.completedSessions = 0;
        this.cancelledSessions = 0;
        this.upcomingSessions = 0;
        this.sessionsAsStudent = 0;
        this.sessionsAsTeacher = 0;
        this.sessionsNeedingRating = 0;
        this.averageRatingReceived = 0.0;
        this.averageRatingGiven = 0.0;
    }
}

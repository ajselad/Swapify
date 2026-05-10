package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private MeetingType meetingType = MeetingType.VIDEO_CALL;

    @Column(nullable = false)
    private Integer durationMinutes = 60;

    @Column(name = "student_message", length = 1000)
    private String studentMessage;

    @Column(name = "teacher_response", length = 1000)
    private String teacherResponse;


    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "meeting_location")
    private String meetingLocation;

    @Column(name = "meeting_notes", length = 2000)
    private String meetingNotes;


    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 1000)
    private String cancellationReason;

    @Column(name = "cancelled_by_user_id")
    private Long cancelledByUserId;


    @Column(name = "student_rating")
    private Integer studentRating;

    @Column(name = "teacher_rating")
    private Integer teacherRating;

    @Column(name = "student_review", length = 1000)
    private String studentReview;

    @Column(name = "teacher_review", length = 1000)
    private String teacherReview;

    @Column(name = "student_rated_at")
    private LocalDateTime studentRatedAt;

    @Column(name = "teacher_rated_at")
    private LocalDateTime teacherRatedAt;


    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SessionStatus {
        PENDING,
        ACCEPTED,
        DECLINED,
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        NO_SHOW
    }

    public enum MeetingType {
        VIDEO_CALL, IN_PERSON, PHONE
    }


    public boolean canBeScheduled() {
        return status == SessionStatus.ACCEPTED;
    }

    public boolean canBeCancelled() {
        return status == SessionStatus.PENDING ||
                status == SessionStatus.ACCEPTED ||
                status == SessionStatus.SCHEDULED;
    }

    public boolean canBeCompleted() {
        return status == SessionStatus.SCHEDULED ||
                status == SessionStatus.IN_PROGRESS;
    }

    public boolean canBeRated() {
        return status == SessionStatus.COMPLETED;
    }

    public boolean needsStudentRating() {
        return status == SessionStatus.COMPLETED && studentRating == null;
    }

    public boolean needsTeacherRating() {
        return status == SessionStatus.COMPLETED && teacherRating == null;
    }

    public String getOtherParticipantName(Long currentUserId) {
        if (student.getId().equals(currentUserId)) {
            return teacher.getFullName();
        } else {
            return student.getFullName();
        }
    }

    public User getOtherParticipant(Long currentUserId) {
        if (student.getId().equals(currentUserId)) {
            return teacher;
        } else {
            return student;
        }
    }

    public boolean isStudent(Long userId) {
        return student.getId().equals(userId);
    }

    public boolean isTeacher(Long userId) {
        return teacher.getId().equals(userId);
    }

    public String getStatusDisplayText() {
        switch (status) {
            case PENDING:
                return "Waiting for teacher response";
            case ACCEPTED:
                return "Accepted - needs scheduling";
            case DECLINED:
                return "Declined by teacher";
            case SCHEDULED:
                return "Scheduled for " + (scheduledAt != null ? scheduledAt.toLocalDate() : "TBD");
            case IN_PROGRESS:
                return "Session in progress";
            case COMPLETED:
                return "Session completed";
            case CANCELLED:
                return "Session cancelled";
            case NO_SHOW:
                return "No show";
            default:
                return status.toString();
        }
    }
}
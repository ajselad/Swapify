package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;


    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final EmailService emailService;

    // ========== SESSION BOOKING ==========

    public SessionDto bookSession(Long studentId, SessionBookingRequest request) {
        log.info("Booking session - Student: {}, Teacher: {}, Skill: {}",
                studentId, request.getTeacherId(), request.getSkillId());

        // Validate users exist
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));

        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        // Validate student can't book with themselves
        if (studentId.equals(request.getTeacherId())) {
            throw new RuntimeException("You cannot book a session with yourself");
        }

        // Check for existing active sessions between these users for this skill
        List<Session> existingSessions = sessionRepository.findActiveSessionsBetweenUsers(
                studentId, request.getTeacherId(), request.getSkillId());

        if (!existingSessions.isEmpty()) {
            throw new RuntimeException("You already have an active session with this teacher for this skill");
        }

        // Create session
        Session session = new Session();
        session.setTitle(request.getTitle().trim());
        session.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        session.setStudent(student);
        session.setTeacher(teacher);
        session.setSkill(skill);
        session.setStatus(Session.SessionStatus.PENDING);
        session.setMeetingType(Session.MeetingType.valueOf(request.getMeetingType()));
        session.setDurationMinutes(request.getDurationMinutes());
        session.setStudentMessage(request.getStudentMessage() != null ? request.getStudentMessage().trim() : "");

        Session savedSession = sessionRepository.save(session);

        // Send notification email to teacher
        try {
            emailService.sendSessionRequestNotification(
                    teacher.getEmail(),
                    teacher.getFullName(),
                    student.getFullName(),
                    skill.getName(),
                    savedSession.getTitle()
            );
            log.info("Session request notification sent to teacher: {}", teacher.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send session request notification", e);
            // Don't fail the booking if email fails
        }

        log.info("Session booked successfully - ID: {}", savedSession.getId());

        return convertToDto(savedSession, studentId);
    }

    // ========== SESSION RESPONSES ==========

    public SessionDto respondToSession(Long sessionId, Long teacherId, SessionResponseRequest request) {
        log.info("Responding to session {} - Teacher: {}, Response: {}",
                sessionId, teacherId, request.getResponseType());

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate teacher owns this session
        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not the teacher for this session");
        }

        // Validate session can be responded to
        if (session.getStatus() != Session.SessionStatus.PENDING) {
            throw new RuntimeException("This session has already been responded to");
        }

        // Update session based on response
        if (request.getResponseType().equals("ACCEPT")) {
            session.setStatus(Session.SessionStatus.ACCEPTED);
            session.setTeacherResponse(request.getResponseMessage() != null ?
                    request.getResponseMessage().trim() : "Session accepted!");
        } else {
            session.setStatus(Session.SessionStatus.DECLINED);
            session.setTeacherResponse(request.getResponseMessage() != null ?
                    request.getResponseMessage().trim() : "Session declined.");
        }

        Session savedSession = sessionRepository.save(session);

        // Send notification email to student
        try {
            emailService.sendSessionResponseNotification(
                    savedSession.getStudent().getEmail(),
                    savedSession.getStudent().getFullName(),
                    savedSession.getTeacher().getFullName(),
                    savedSession.getSkill().getName(),
                    savedSession.getTitle(),
                    request.getResponseType(),
                    request.getResponseMessage()
            );
            log.info("Session response notification sent to student: {}", savedSession.getStudent().getEmail());
        } catch (Exception e) {
            log.warn("Failed to send session response notification", e);
            // Don't fail the response if email fails
        }

        log.info("Session {} {} by teacher {}", sessionId,
                request.getResponseType().toLowerCase(), teacherId);

        return convertToDto(savedSession, teacherId);
    }

    // ========== SESSION SCHEDULING ==========

    public SessionDto scheduleSession(Long sessionId, Long userId, SessionSchedulingRequest request) {
        log.info("Scheduling session {} by user {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant and session can be scheduled
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        if (!session.canBeScheduled()) {
            throw new RuntimeException("This session cannot be scheduled in its current state");
        }

        // Validate scheduled time is in the future
        if (request.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Scheduled time must be in the future");
        }

        // Check for teacher conflicts
        if (session.isTeacher(userId)) {
            List<Session> conflicts = sessionRepository.findTeacherSessionsInTimeRange(
                    session.getTeacher().getId(),
                    request.getScheduledAt(),
                    request.getScheduledAt().plusMinutes(session.getDurationMinutes())
            );

            if (!conflicts.isEmpty()) {
                throw new RuntimeException("Teacher is not available at this time");
            }
        }

        // Update session
        session.setScheduledAt(request.getScheduledAt());
        session.setMeetingLink(request.getMeetingLink() != null ? request.getMeetingLink().trim() : null);
        session.setMeetingLocation(request.getMeetingLocation() != null ? request.getMeetingLocation().trim() : null);
        session.setMeetingNotes(request.getMeetingNotes() != null ? request.getMeetingNotes().trim() : null);
        session.setStatus(Session.SessionStatus.SCHEDULED);

        Session savedSession = sessionRepository.save(session);

        log.info("Session {} scheduled for {}", sessionId, request.getScheduledAt());

        return convertToDto(savedSession, userId);
    }

    public SessionDto rescheduleSession(Long sessionId, Long userId, SessionSchedulingRequest request) {
        log.info("Rescheduling session {} by user {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        // Validate session can be rescheduled
        if (session.getStatus() != Session.SessionStatus.SCHEDULED) {
            throw new RuntimeException("Only scheduled sessions can be rescheduled");
        }

        // Use same logic as scheduling
        return scheduleSession(sessionId, userId, request);
    }

    // ========== SESSION LIFECYCLE ==========

    public SessionDto completeSession(Long sessionId, Long userId) {
        log.info("Completing session {} by user {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        if (!session.canBeCompleted()) {
            throw new RuntimeException("This session cannot be marked as complete");
        }

        session.setStatus(Session.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        Session savedSession = sessionRepository.save(session);

        log.info("Session {} marked as completed", sessionId);

        return convertToDto(savedSession, userId);
    }

    public SessionDto cancelSession(Long sessionId, Long userId, SessionCancellationRequest request) {
        log.info("Cancelling session {} by user {}", sessionId, userId);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        if (!session.canBeCancelled()) {
            throw new RuntimeException("This session cannot be cancelled");
        }

        session.setStatus(Session.SessionStatus.CANCELLED);
        session.setCancelledAt(LocalDateTime.now());
        session.setCancellationReason(request.getCancellationReason().trim());
        session.setCancelledByUserId(userId);

        Session savedSession = sessionRepository.save(session);

        log.info("Session {} cancelled by user {}", sessionId, userId);

        return convertToDto(savedSession, userId);
    }

    public SessionDto rateSession(Long sessionId, Long userId, SessionRatingRequest request) {
        log.info("Rating session {} by user {} - Rating: {}", sessionId, userId, request.getRating());

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        if (!session.canBeRated()) {
            throw new RuntimeException("This session cannot be rated");
        }

        // Set rating based on user role
        if (session.isStudent(userId)) {
            if (session.getStudentRating() != null) {
                throw new RuntimeException("You have already rated this session");
            }
            session.setStudentRating(request.getRating());
            session.setStudentReview(request.getFeedback() != null ? request.getFeedback().trim() : null);
            session.setStudentRatedAt(LocalDateTime.now());
        } else {
            if (session.getTeacherRating() != null) {
                throw new RuntimeException("You have already rated this session");
            }
            session.setTeacherRating(request.getRating());
            session.setTeacherReview(request.getFeedback() != null ? request.getFeedback().trim() : null);
            session.setTeacherRatedAt(LocalDateTime.now());
        }

        Session savedSession = sessionRepository.save(session);

        log.info("Session {} rated by user {}", sessionId, userId);

        return convertToDto(savedSession, userId);
    }

    // ========== SESSION RETRIEVAL ==========

    public SessionListResponse getUserSessions(Long userId, int page, int size,
                                               String sortBy, String sortDir) {
        log.info("Fetching sessions for user {} - Page: {}, Size: {}", userId, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Session> sessionPage = sessionRepository.findByUserId(userId, pageable);

        List<SessionDto> sessionDtos = sessionPage.getContent().stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());

        return new SessionListResponse(
                sessionDtos,
                (int) sessionPage.getTotalElements(),
                sessionPage.getTotalPages(),
                page,
                size,
                sessionPage.hasNext(),
                sessionPage.hasPrevious()
        );
    }

    public SessionListResponse getSessionsAsStudent(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Session> sessionPage = sessionRepository.findByStudentId(userId, pageable);

        List<SessionDto> sessionDtos = sessionPage.getContent().stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());

        return new SessionListResponse(
                sessionDtos,
                (int) sessionPage.getTotalElements(),
                sessionPage.getTotalPages(),
                page,
                size,
                sessionPage.hasNext(),
                sessionPage.hasPrevious()
        );
    }

    public SessionListResponse getSessionsAsTeacher(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Session> sessionPage = sessionRepository.findByTeacherId(userId, pageable);

        List<SessionDto> sessionDtos = sessionPage.getContent().stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());

        return new SessionListResponse(
                sessionDtos,
                (int) sessionPage.getTotalElements(),
                sessionPage.getTotalPages(),
                page,
                size,
                sessionPage.hasNext(),
                sessionPage.hasPrevious()
        );
    }

    public List<SessionDto> getSessionsNeedingAction(Long userId) {
        List<Session> sessions = sessionRepository.findSessionsNeedingTeacherAction(userId);

        return sessions.stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());
    }

    public List<SessionDto> getUpcomingSessions(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        List<Session> sessions = sessionRepository.findUpcomingSessions(
                userId, Session.SessionStatus.SCHEDULED, now, tomorrow);

        return sessions.stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());
    }

    public List<SessionDto> getSessionsToRate(Long userId) {
        List<Session> sessions = sessionRepository.findSessionsToRate(userId);

        return sessions.stream()
                .map(session -> convertToDto(session, userId))
                .collect(Collectors.toList());
    }

    public SessionStatsDto getSessionStats(Long userId) {
        log.info("Calculating session stats for user {}", userId);

        SessionStatsDto stats = new SessionStatsDto();

        // Total counts
        Long total = sessionRepository.countByUserId(userId);
        stats.setTotalSessions(total != null ? total.intValue() : 0);

        Long asStudent = sessionRepository.countByStudentId(userId);
        stats.setSessionsAsStudent(asStudent != null ? asStudent.intValue() : 0);

        Long asTeacher = sessionRepository.countByTeacherId(userId);
        stats.setSessionsAsTeacher(asTeacher != null ? asTeacher.intValue() : 0);

        // Status counts
        Long pending = sessionRepository.countByUserIdAndStatus(userId, Session.SessionStatus.PENDING);
        stats.setPendingSessions(pending != null ? pending.intValue() : 0);

        Long accepted = sessionRepository.countByUserIdAndStatus(userId, Session.SessionStatus.ACCEPTED);
        stats.setAcceptedSessions(accepted != null ? accepted.intValue() : 0);

        Long scheduled = sessionRepository.countByUserIdAndStatus(userId, Session.SessionStatus.SCHEDULED);
        stats.setScheduledSessions(scheduled != null ? scheduled.intValue() : 0);

        Long completed = sessionRepository.countByUserIdAndStatus(userId, Session.SessionStatus.COMPLETED);
        stats.setCompletedSessions(completed != null ? completed.intValue() : 0);

        Long cancelled = sessionRepository.countByUserIdAndStatus(userId, Session.SessionStatus.CANCELLED);
        stats.setCancelledSessions(cancelled != null ? cancelled.intValue() : 0);

        // Upcoming sessions (next 24 hours)
        List<SessionDto> upcoming = getUpcomingSessions(userId);
        stats.setUpcomingSessions(upcoming.size());

        // Sessions needing rating
        List<SessionDto> toRate = getSessionsToRate(userId);
        stats.setSessionsNeedingRating(toRate.size());

        // Average ratings
        Double avgReceived = sessionRepository.getAverageRatingReceived(userId);
        stats.setAverageRatingReceived(avgReceived != null ? avgReceived : 0.0);

        Double avgGiven = sessionRepository.getAverageRatingGiven(userId);
        stats.setAverageRatingGiven(avgGiven != null ? avgGiven : 0.0);

        return stats;
    }

    public SessionDto getSession(Long sessionId, Long userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        return convertToDto(session, userId);
    }

    // ========== MEETING MANAGEMENT ==========

    public MeetingInfoDto getMeetingInfo(Long sessionId, Long userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Validate user is participant
        if (!session.getStudent().getId().equals(userId) && !session.getTeacher().getId().equals(userId)) {
            throw new RuntimeException("You are not a participant in this session");
        }

        MeetingInfoDto meetingInfo = new MeetingInfoDto();
        meetingInfo.setSessionId(session.getId());
        meetingInfo.setMeetingLink(session.getMeetingLink());
        meetingInfo.setMeetingLocation(session.getMeetingLocation());
        meetingInfo.setMeetingNotes(session.getMeetingNotes());
        meetingInfo.setScheduledAt(session.getScheduledAt());
        meetingInfo.setDurationMinutes(session.getDurationMinutes());
        meetingInfo.setOtherParticipantName(session.getOtherParticipantName(userId));

        // Calculate if user can join
        if (session.getScheduledAt() != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime meetingStart = session.getScheduledAt();
            LocalDateTime joinWindow = meetingStart.minusMinutes(15); // Can join 15 min early
            LocalDateTime meetingEnd = meetingStart.plusMinutes(session.getDurationMinutes());

            boolean canJoin = now.isAfter(joinWindow) && now.isBefore(meetingEnd) &&
                    session.getMeetingLink() != null && !session.getMeetingLink().isEmpty();

            meetingInfo.setCanJoin(canJoin);

            // Minutes until start
            if (now.isBefore(meetingStart)) {
                long minutesUntil = java.time.Duration.between(now, meetingStart).toMinutes();
                meetingInfo.setMinutesUntilStart((int) minutesUntil);
            } else {
                meetingInfo.setMinutesUntilStart(0);
            }

            // Join instructions
            if (canJoin) {
                meetingInfo.setJoinInstructions("Click the meeting link to join the session");
            } else if (now.isBefore(joinWindow)) {
                meetingInfo.setJoinInstructions("Meeting link will be available 15 minutes before start time");
            } else {
                meetingInfo.setJoinInstructions("Meeting has ended");
            }
        } else {
            meetingInfo.setCanJoin(false);
            meetingInfo.setJoinInstructions("Session is not yet scheduled");
        }

        return meetingInfo;
    }





    // ========== CONVERSION METHODS ==========

    // UPDATED: Key method to include student and teacher IDs
    private SessionDto convertToDto(Session session, Long currentUserId) {
        SessionDto dto = new SessionDto();

        dto.setId(session.getId());
        dto.setTitle(session.getTitle());
        dto.setDescription(session.getDescription());
        dto.setStatus(session.getStatus().toString());
        dto.setMeetingType(session.getMeetingType() != null ? session.getMeetingType().toString() : "VIDEO_CALL");
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setStudentMessage(session.getStudentMessage());
        dto.setTeacherResponse(session.getTeacherResponse());

        // IMPORTANT: Set student and teacher IDs for messaging functionality
        dto.setStudentId(session.getStudent().getId());
        dto.setTeacherId(session.getTeacher().getId());

        // Scheduling info
        dto.setScheduledAt(session.getScheduledAt());
        dto.setMeetingLink(session.getMeetingLink());
        dto.setMeetingLocation(session.getMeetingLocation());
        dto.setMeetingNotes(session.getMeetingNotes());

        // Completion info
        dto.setCompletedAt(session.getCompletedAt());
        dto.setCancelledAt(session.getCancelledAt());
        dto.setCancellationReason(session.getCancellationReason());

        // Rating info
        dto.setStudentRating(session.getStudentRating());
        dto.setTeacherRating(session.getTeacherRating());
        dto.setStudentReview(session.getStudentReview());
        dto.setTeacherReview(session.getTeacherReview());

        // Timestamps
        dto.setCreatedAt(session.getCreatedAt());
        dto.setUpdatedAt(session.getUpdatedAt());

        // User profiles
        dto.setStudent(convertToUserSummary(session.getStudent()));
        dto.setTeacher(convertToUserSummary(session.getTeacher()));

        // Skill info
        dto.setSkill(convertToSkillDto(session.getSkill()));

        // Helper fields
        dto.setStatusDisplayText(session.getStatusDisplayText());
        dto.setOtherParticipantName(session.getOtherParticipantName(currentUserId));
        dto.setOtherParticipant(convertToUserSummary(session.getOtherParticipant(currentUserId)));

        // Action flags
        dto.setNeedsAction(calculateNeedsAction(session, currentUserId));
        dto.setCanSchedule(calculateCanSchedule(session, currentUserId));
        dto.setCanCancel(session.canBeCancelled());
        dto.setCanComplete(calculateCanComplete(session, currentUserId));
        dto.setCanRate(calculateCanRate(session, currentUserId));
        dto.setCanJoinMeeting(calculateCanJoinMeeting(session));

        // Time calculations
        if (session.getScheduledAt() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(session.getScheduledAt())) {
                long minutesUntil = java.time.Duration.between(now, session.getScheduledAt()).toMinutes();
                dto.setMinutesUntilStart((int) minutesUntil);
            }
        }

        return dto;
    }

    private UserProfileSummaryDto convertToUserSummary(User user) {
        UserProfileSummaryDto dto = new UserProfileSummaryDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        dto.setLocation(user.getLocation());
        dto.setExperienceLevel(user.getExperienceLevel());

        // Calculate actual rating from completed sessions
        Double actualRating = sessionRepository.getAverageRatingReceived(user.getId());
        dto.setRating(actualRating != null && actualRating > 0 ? actualRating : null);

        // Count actual reviews
        Long reviewCount = sessionRepository.countCompletedSessionsWithRating(user.getId());
        dto.setReviewCount(reviewCount != null ? reviewCount.intValue() : 0);

        return dto;
    }

    private SkillDto convertToSkillDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setCategory(skill.getCategory());
        dto.setDescription(skill.getDescription());
        dto.setCreatedAt(skill.getCreatedAt());
        return dto;
    }



    // ========== HELPER METHODS ==========

    private boolean calculateNeedsAction(Session session, Long userId) {
        return (session.getTeacher().getId().equals(userId) &&
                session.getStatus() == Session.SessionStatus.PENDING) ||
                (session.getTeacher().getId().equals(userId) &&
                        session.getStatus() == Session.SessionStatus.ACCEPTED);
    }

    private boolean calculateCanSchedule(Session session, Long userId) {
        return session.canBeScheduled() &&
                (session.getTeacher().getId().equals(userId) || session.getStudent().getId().equals(userId));
    }

    private boolean calculateCanComplete(Session session, Long userId) {
        return session.canBeCompleted() &&
                (session.getTeacher().getId().equals(userId) || session.getStudent().getId().equals(userId));
    }

    private boolean calculateCanRate(Session session, Long userId) {
        if (!session.canBeRated()) {
            return false;
        }

        if (session.isStudent(userId)) {
            return session.getStudentRating() == null;
        } else if (session.isTeacher(userId)) {
            return session.getTeacherRating() == null;
        }

        return false;
    }

    private boolean calculateCanJoinMeeting(Session session) {
        if (session.getScheduledAt() == null || session.getMeetingLink() == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime meetingStart = session.getScheduledAt();
        LocalDateTime joinWindow = meetingStart.minusMinutes(15);
        LocalDateTime meetingEnd = meetingStart.plusMinutes(session.getDurationMinutes());

        return now.isAfter(joinWindow) && now.isBefore(meetingEnd);
    }
}
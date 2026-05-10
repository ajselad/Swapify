// SessionController.java - Complete REST API for session management
package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionController {

    private final SessionService sessionService;


    @PostMapping("/book")
    public ResponseEntity<?> bookSession(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody SessionBookingRequest request) {

        log.info("Session booking request from user: {} for teacher: {}",
                currentUser.getEmail(), request.getTeacherId());

        try {
            SessionDto session = sessionService.bookSession(currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session booking failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session booking", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }



    @PostMapping("/{sessionId}/respond")
    public ResponseEntity<?> respondToSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionResponseRequest request) {

        log.info("Session response from user: {} for session: {} - {}",
                currentUser.getEmail(), sessionId, request.getResponseType());

        try {
            SessionDto session = sessionService.respondToSession(sessionId, currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session response failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session response", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }



    @PostMapping("/{sessionId}/schedule")
    public ResponseEntity<?> scheduleSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionSchedulingRequest request) {

        log.info("Session scheduling request from user: {} for session: {}",
                currentUser.getEmail(), sessionId);

        try {
            SessionDto session = sessionService.scheduleSession(sessionId, currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session scheduling failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session scheduling", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }

    @PostMapping("/{sessionId}/reschedule")
    public ResponseEntity<?> rescheduleSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionSchedulingRequest request) {

        log.info("Session rescheduling request from user: {} for session: {}",
                currentUser.getEmail(), sessionId);

        try {
            SessionDto session = sessionService.rescheduleSession(sessionId, currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session rescheduling failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session rescheduling", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }



    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<?> completeSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId) {

        log.info("Session completion request from user: {} for session: {}",
                currentUser.getEmail(), sessionId);

        try {
            SessionDto session = sessionService.completeSession(sessionId, currentUser.getId());
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session completion failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session completion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }

    @PostMapping("/{sessionId}/cancel")
    public ResponseEntity<?> cancelSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionCancellationRequest request) {

        log.info("Session cancellation request from user: {} for session: {}",
                currentUser.getEmail(), sessionId);

        try {
            SessionDto session = sessionService.cancelSession(sessionId, currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session cancellation failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session cancellation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }

    @PostMapping("/{sessionId}/rate")
    public ResponseEntity<?> rateSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionRatingRequest request) {

        log.info("Session rating request from user: {} for session: {} - Rating: {}",
                currentUser.getEmail(), sessionId, request.getRating());

        try {
            SessionDto session = sessionService.rateSession(sessionId, currentUser.getId(), request);
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Session rating failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during session rating", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }



    @GetMapping("/my")
    public ResponseEntity<?> getUserSessions(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("Fetching sessions for user: {} - Page: {}, Size: {}",
                currentUser.getEmail(), page, size);

        try {
            SessionListResponse sessions = sessionService.getUserSessions(
                    currentUser.getId(), page, size, sortBy, sortDir);
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching user sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch sessions"));
        }
    }

    @GetMapping("/as-student")
    public ResponseEntity<?> getSessionsAsStudent(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            SessionListResponse sessions = sessionService.getSessionsAsStudent(
                    currentUser.getId(), page, size);
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching student sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch student sessions"));
        }
    }

    @GetMapping("/as-teacher")
    public ResponseEntity<?> getSessionsAsTeacher(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            SessionListResponse sessions = sessionService.getSessionsAsTeacher(
                    currentUser.getId(), page, size);
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching teacher sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch teacher sessions"));
        }
    }

    @GetMapping("/actions-needed")
    public ResponseEntity<?> getSessionsNeedingAction(@AuthenticationPrincipal User currentUser) {
        try {
            List<SessionDto> sessions = sessionService.getSessionsNeedingAction(currentUser.getId());
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching sessions needing action", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch sessions needing action"));
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingSessions(@AuthenticationPrincipal User currentUser) {
        try {
            List<SessionDto> sessions = sessionService.getUpcomingSessions(currentUser.getId());
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching upcoming sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch upcoming sessions"));
        }
    }

    @GetMapping("/to-rate")
    public ResponseEntity<?> getSessionsToRate(@AuthenticationPrincipal User currentUser) {
        try {
            List<SessionDto> sessions = sessionService.getSessionsToRate(currentUser.getId());
            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            log.error("Error fetching sessions to rate", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch sessions to rate"));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getSessionStats(@AuthenticationPrincipal User currentUser) {
        try {
            SessionStatsDto stats = sessionService.getSessionStats(currentUser.getId());
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching session stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch session statistics"));
        }
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId) {

        try {
            SessionDto session = sessionService.getSession(sessionId, currentUser.getId());
            return ResponseEntity.ok(session);

        } catch (RuntimeException e) {
            log.error("Error fetching session: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching session", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch session"));
        }
    }


    @GetMapping("/{sessionId}/meeting-info")
    public ResponseEntity<?> getMeetingInfo(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long sessionId) {

        try {
            MeetingInfoDto meetingInfo = sessionService.getMeetingInfo(sessionId, currentUser.getId());
            return ResponseEntity.ok(meetingInfo);

        } catch (RuntimeException e) {
            log.error("Error fetching meeting info: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching meeting info", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch meeting information"));
        }
    }









}
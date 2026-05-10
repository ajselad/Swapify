package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<?> getDashboardOverview(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching dashboard overview for user: {}", currentUser.getEmail());

        try {
            DashboardOverviewDto overview = dashboardService.getDashboardOverview(currentUser.getId());
            return ResponseEntity.ok(overview);

        } catch (Exception e) {
            log.error("Error fetching dashboard overview for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch dashboard data"));
        }
    }

    @GetMapping("/recent-messages")
    public ResponseEntity<?> getRecentMessages(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching recent messages for user: {}", currentUser.getEmail());

        try {
            var recentMessages = dashboardService.getRecentMessages(currentUser.getId());
            return ResponseEntity.ok(recentMessages);

        } catch (Exception e) {
            log.error("Error fetching recent messages for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch recent messages"));
        }
    }

    @GetMapping("/recommended-users")
    public ResponseEntity<?> getRecommendedUsers(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching recommended users for user: {}", currentUser.getEmail());

        try {
            var recommendedUsers = dashboardService.getRecommendedUsers(currentUser.getId());
            return ResponseEntity.ok(recommendedUsers);

        } catch (Exception e) {
            log.error("Error fetching recommended users for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch recommended users"));
        }
    }

    @GetMapping("/upcoming-sessions")
    public ResponseEntity<?> getUpcomingSessions(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching upcoming sessions for user: {}", currentUser.getEmail());

        try {
            var upcomingSessions = dashboardService.getUpcomingSessions(currentUser.getId());
            return ResponseEntity.ok(upcomingSessions);

        } catch (Exception e) {
            log.error("Error fetching upcoming sessions for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch upcoming sessions"));
        }
    }
}
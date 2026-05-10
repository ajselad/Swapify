package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.ProfileResponse;
import com.example.demo.dto.ProfileUpdateRequest;
import com.example.demo.dto.UserPublicProfileDto;
import com.example.demo.entity.User;
import com.example.demo.service.ProfileService;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getCurrentUserProfile(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching profile for user: {}", currentUser.getEmail());

        try {
            ProfileResponse profile = profileService.getUserProfile(currentUser.getId());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Failed to fetch profile for user: {} - ERROR: {}", currentUser.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUserProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ProfileUpdateRequest request) {
        log.info("Updating profile for user: {}", currentUser.getEmail());

        try {
            ProfileResponse updatedProfile = profileService.updateUserProfile(currentUser.getId(), request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            log.error("Profile update failed for user: {} - ERROR: {}", currentUser.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/completion-status")
    public ResponseEntity<?> getProfileCompletionStatus(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching completion status for user: {}", currentUser.getEmail());

        try {
            int completionPercentage = profileService.calculateProfileCompletionPercentage(currentUser.getId());
            ProfileCompletionResponse response = new ProfileCompletionResponse(completionPercentage);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch completion status for user: {} - ERROR: {}", currentUser.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPublicProfile(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Fetching public profile for user: {} by: {}", userId, currentUser.getEmail());

        try {
            UserPublicProfileDto profile = userService.getPublicUserProfile(userId, currentUser.getId());
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            log.error("Error fetching user profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching user profile", e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Failed to fetch user profile"));
        }
    }


    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfile(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        return getUserPublicProfile(currentUser, userId);
    }


    public static class ProfileCompletionResponse {
        private int completionPercentage;
        private boolean isComplete;

        public ProfileCompletionResponse(int completionPercentage) {
            this.completionPercentage = completionPercentage;
            this.isComplete = completionPercentage >= 80; // Consider 80%+ as complete
        }



    }
}
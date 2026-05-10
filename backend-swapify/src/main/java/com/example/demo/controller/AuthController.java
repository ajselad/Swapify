package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserProfileSummaryDto;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for email: {}", loginRequest.getEmail());

        try {
            AuthResponse authResponse = userService.login(loginRequest);


            if ("VERIFICATION_REQUIRED".equals(authResponse.getToken())) {
                log.info("Login verification required for email: {}", loginRequest.getEmail());
                return ResponseEntity.ok(authResponse);
            }

            log.info("Login successful for email: {}", loginRequest.getEmail());
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            log.error("Login failed for email: {} - ERROR: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Registration attempt for email: {}", registerRequest.getEmail());

        try {
            AuthResponse authResponse = userService.register(registerRequest);
            log.info("Registration successful for email: {} (verification required)", registerRequest.getEmail());

            return ResponseEntity.ok(new MessageResponse(
                    "Registration successful! Please check your email for a 6-digit verification code."
            ));
        } catch (Exception e) {
            log.error("Registration failed for email: {} - ERROR: {}", registerRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyEmailWithCode(@RequestParam String email, @RequestParam String code, @RequestParam(required = false) String action) {
        log.info("Email verification attempt with code for email: {} (action: {})", email, action);

        try {
            if ("login".equals(action)) {

                log.info("Processing login verification for: {}", email);
                AuthResponse authResponse = userService.loginWithVerificationCode(email, code);
                log.info("Login completed successfully for: {}", email);
                return ResponseEntity.ok(authResponse);
            } else {

                log.info("Processing registration verification for: {}", email);
                boolean verified = userService.verifyEmailWithCode(email, code);
                if (verified) {
                    log.info("Registration verification successful for: {}", email);
                    return ResponseEntity.ok(new MessageResponse(
                            "Email verified successfully! Your account is now active. You can now log in."
                    ));
                } else {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Email verification failed"));
                }
            }
        } catch (Exception e) {
            log.error("Email verification failed for: {} (action: {}) - ERROR: {}", email, action, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendVerificationCode(@RequestParam String email, @RequestParam(required = false) String context) {
        log.info("Resend verification code request for: {} (context: {})", email, context);

        try {
            userService.resendVerificationCode(email);
            String message;
            if ("login".equals(context)) {
                message = "Login verification code sent! Please check your email for the new 6-digit code.";
            } else {
                message = "Verification code sent! Please check your email for the new 6-digit code.";
            }

            return ResponseEntity.ok(new MessageResponse(message));
        } catch (Exception e) {
            log.error("Resend verification code failed for: {} - ERROR: {}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        return ResponseEntity.ok(new MessageResponse("User logged out successfully!"));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailExists(@RequestParam String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(new MessageResponse(exists ? "Email exists" : "Email available"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching current user info for: {}", currentUser.getEmail());

        try {
            UserProfileSummaryDto userDto = new UserProfileSummaryDto();
            userDto.setId(currentUser.getId());
            userDto.setFirstName(currentUser.getFirstName());
            userDto.setLastName(currentUser.getLastName());
            userDto.setProfileImageUrl(currentUser.getProfileImageUrl());
            userDto.setLocation(currentUser.getLocation());
            userDto.setExperienceLevel(currentUser.getExperienceLevel());

            return ResponseEntity.ok(userDto);

        } catch (Exception e) {
            log.error("Error fetching current user info", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch user info"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody Map<String, String> request) {
        String email = request.get("email");
        log.info("Password reset request for email: {}", email);

        try {
            userService.initiatePasswordReset(email);
            return ResponseEntity.ok(new MessageResponse(
                    "Password reset code sent! Please check your email for a 6-digit verification code."
            ));
        } catch (Exception e) {
            log.error("Password reset failed for email: {} - ERROR: {}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        log.info("Password reset attempt for email: {}", email);

        try {

            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Passwords do not match"));
            }


            if (!userService.validateResetCode(email, code)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Invalid or expired reset code"));
            }


            userService.resetPassword(email, code, newPassword);

            return ResponseEntity.ok(new MessageResponse(
                    "Password reset successful! You can now log in with your new password."
            ));
        } catch (Exception e) {
            log.error("Password reset failed for email: {} - ERROR: {}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/validate-reset-code")
    public ResponseEntity<?> validateResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        log.info("Validating reset code for email: {}", email);

        try {
            boolean isValid = userService.validateResetCode(email, code);
            if (isValid) {
                return ResponseEntity.ok(new MessageResponse("Code is valid"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Invalid or expired reset code"));
            }
        } catch (Exception e) {
            log.error("Code validation failed for email: {} - ERROR: {}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
    @GetMapping("/admin-check")
    public ResponseEntity<?> checkAdminAccess(@AuthenticationPrincipal User currentUser) {
        log.info("Admin access check for user: {}", currentUser.getEmail());

        try {
            boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;

            return ResponseEntity.ok(Map.of(
                    "isAdmin", isAdmin,
                    "role", currentUser.getRole().toString(),
                    "redirectTo", isAdmin ? "/admin/dashboard" : "/dashboard"
            ));

        } catch (Exception e) {
            log.error("Error checking admin access for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to check admin access"));
        }
    }
}
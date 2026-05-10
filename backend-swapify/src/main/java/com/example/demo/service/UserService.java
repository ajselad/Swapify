package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserPublicProfileDto;
import com.example.demo.entity.User;

public interface UserService {

    // Authentication methods
    AuthResponse register(RegisterRequest registerRequest);
    AuthResponse login(LoginRequest loginRequest);
    AuthResponse loginWithVerificationCode(String email, String code); // ADDED MISSING METHOD
    boolean verifyEmailWithCode(String email, String code);
    void resendVerificationCode(String email);

    // User lookup methods
    User findByEmail(String email);
    boolean existsByEmail(String email);

    // Password reset methods
    void initiatePasswordReset(String email);
    boolean validateResetCode(String email, String code);
    void resetPassword(String email, String code, String newPassword);

    // Profile methods - NEW
    UserPublicProfileDto getPublicUserProfile(Long userId, Long currentUserId);
}
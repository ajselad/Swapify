package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;
    private final UserSkillRepository userSkillRepository;
    private final UserLearningGoalRepository userLearningGoalRepository;

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        log.info("Registering new user with email: {}", registerRequest.getEmail());

        String emailError = emailValidationService.getEmailValidationError(registerRequest.getEmail());
        if (emailError != null) {
            throw new RuntimeException(emailError);
        }

        Optional<User> existingUser = userRepository.findByEmail(registerRequest.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();

            if (user.isEmailVerified()) {
                throw new RuntimeException("Email is already in use!");
            } else {
                user.setFirstName(registerRequest.getFirstName().trim());
                user.setLastName(registerRequest.getLastName().trim());
                user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

                String verificationCode = emailService.generateVerificationCode();
                String verificationToken = UUID.randomUUID().toString();

                user.setVerificationCode(verificationCode);
                user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
                user.setVerificationToken(verificationToken);
                user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

                User savedUser = userRepository.save(user);

                try {
                    emailService.sendVerificationCode(
                            savedUser.getEmail(),
                            savedUser.getFullName(),
                            verificationCode
                    );
                } catch (Exception e) {
                    log.error("Failed to send verification code email to: {}", savedUser.getEmail(), e);
                }

                return new AuthResponse(
                        null,
                        savedUser.getId(),
                        savedUser.getFirstName(),
                        savedUser.getLastName(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()

                );
            }
        }

        String verificationCode = emailService.generateVerificationCode();
        String verificationToken = UUID.randomUUID().toString();

        User user = new User();
        user.setFirstName(registerRequest.getFirstName().trim());
        user.setLastName(registerRequest.getLastName().trim());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        user.setRole(User.UserRole.USER); // default role
        user.setEnabled(false);
        user.setEmailVerified(false);

        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        User savedUser = userRepository.save(user);

        try {
            emailService.sendVerificationCode(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    verificationCode
            );
        } catch (Exception e) {
            log.error("Failed to send verification code email to: {}", savedUser.getEmail(), e);
        }

        return new AuthResponse(
                null,
                savedUser.getId(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getEmail(),
                savedUser.getRole().name()

        );
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        log.info("LOGIN START - Attempting login for email: {}", loginRequest.getEmail());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String verificationCode = emailService.generateVerificationCode();

            user.setVerificationCode(verificationCode);
            user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
            userRepository.saveAndFlush(user);

            try {
                emailService.sendLoginVerificationCode(user.getEmail(), user.getFullName(), verificationCode);
            } catch (Exception e) {
                throw new RuntimeException("Failed to send verification code. Please try again.");
            }

            return new AuthResponse(
                    "VERIFICATION_REQUIRED",
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail(),
                    user.getRole().name()

            );

        } catch (DisabledException e) {
            throw new RuntimeException("Account is disabled.");
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password!");
        }
    }

    @Override
    public AuthResponse loginWithVerificationCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getVerificationCode() == null || !code.equals(user.getVerificationCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        if (!user.isVerificationCodeValid()) {
            throw new RuntimeException("Verification code has expired. Please login again.");
        }

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.setEnabled(true);
        }

        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        String jwt = jwtService.generateToken(user);

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name()

        );
    }

    @Override
    public boolean verifyEmailWithCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!code.equals(user.getVerificationCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        if (!user.isVerificationCodeValid()) {
            throw new RuntimeException("Verification code has expired. Please request a new code.");
        }

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.setEnabled(true);
        }

        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);

        return true;
    }

    @Override
    public void resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String verificationCode = emailService.generateVerificationCode();

        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(5));

        userRepository.saveAndFlush(user);

        boolean isLoginContext = user.isEmailVerified() && user.isEnabled();

        if (isLoginContext) {
            emailService.sendLoginVerificationCode(user.getEmail(), user.getFullName(), verificationCode);
        } else {
            emailService.sendVerificationCode(user.getEmail(), user.getFullName(), verificationCode);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String resetCode = emailService.generateVerificationCode();
        user.setVerificationCode(resetCode);
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(5));

        userRepository.saveAndFlush(user);

        emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), resetCode);
    }

    @Override
    public boolean validateResetCode(String email, String code) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !code.equals(user.getVerificationCode())) {
            return false;
        }

        return user.isVerificationCodeValid();
    }

    @Override
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!code.equals(user.getVerificationCode())) {
            throw new RuntimeException("Invalid reset code");
        }

        if (!user.isVerificationCodeValid()) {
            throw new RuntimeException("Reset code has expired. Please request a new password reset.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);

        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserPublicProfileDto getPublicUserProfile(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEnabled() || !user.isEmailVerified()) {
            throw new RuntimeException("User profile not available");
        }

        UserPublicProfileDto profile = convertToPublicProfileDto(user);

        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        List<UserSkillDto> skillDtos = userSkills.stream()
                .map(this::convertToUserSkillDto)
                .collect(Collectors.toList());
        profile.setSkills(skillDtos);

        List<UserLearningGoal> learningGoals = userLearningGoalRepository.findByUserId(userId);
        List<UserLearningGoalDto> goalDtos = learningGoals.stream()
                .map(this::convertToUserLearningGoalDto)
                .collect(Collectors.toList());
        profile.setLearningGoals(goalDtos);

        if (user.getInterests() != null && !user.getInterests().trim().isEmpty()) {
            List<String> interests = Arrays.stream(user.getInterests().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            profile.setInterests(interests);
        }

        profile.setCanContact(canCurrentUserContact(currentUserId, userId));

        if (user.getCreatedAt() != null) {
            profile.setMemberSince("Member since " +
                    user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMMM yyyy")));
        }

        return profile;
    }

    private UserPublicProfileDto convertToPublicProfileDto(User user) {
        UserPublicProfileDto dto = new UserPublicProfileDto();

        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setExperienceLevel(user.getExperienceLevel());
        dto.setPreferredLearningStyle(user.getPreferredLearningStyle());
        dto.setTimezone(user.getTimezone());
        dto.setAvailability(user.getAvailability());
        dto.setHourlyRate(user.getHourlyRate());
        dto.setIsLookingToLearn(user.getIsLookingToLearn());
        dto.setIsAvailableForTeaching(user.getIsAvailableForTeaching());
        dto.setWebsite(user.getWebsite());
        dto.setLinkedinUrl(user.getLinkedinUrl());
        dto.setGithubUrl(user.getGithubUrl());
        dto.setIsOnline(user.getIsOnline());
        dto.setLastSeen(user.getLastSeen());
        dto.setProfileCompletionPercentage(user.getProfileCompletionPercentage());
        dto.setEmail(user.getEmail());

        return dto;
    }

    private UserSkillDto convertToUserSkillDto(UserSkill userSkill) {
        UserSkillDto dto = new UserSkillDto();
        dto.setId(userSkill.getId());
        dto.setLevel(userSkill.getLevel());
        dto.setYearsOfExperience(userSkill.getYearsOfExperience());
        dto.setDescription(userSkill.getDescription());
        dto.setCreatedAt(userSkill.getCreatedAt());

        if (userSkill.getSkill() != null) {
            SkillDto skillDto = new SkillDto();
            skillDto.setId(userSkill.getSkill().getId());
            skillDto.setName(userSkill.getSkill().getName());
            skillDto.setCategory(userSkill.getSkill().getCategory());
            skillDto.setDescription(userSkill.getSkill().getDescription());
            dto.setSkill(skillDto);
        }

        return dto;
    }

    private UserLearningGoalDto convertToUserLearningGoalDto(UserLearningGoal learningGoal) {
        UserLearningGoalDto dto = new UserLearningGoalDto();
        dto.setId(learningGoal.getId());
        dto.setPriority(learningGoal.getPriority());
        dto.setReason(learningGoal.getReason());
        dto.setTimeCommitmentPerWeek(learningGoal.getTimeCommitmentPerWeek());
        dto.setCreatedAt(learningGoal.getCreatedAt());

        if (learningGoal.getSkill() != null) {
            SkillDto skillDto = new SkillDto();
            skillDto.setId(learningGoal.getSkill().getId());
            skillDto.setName(learningGoal.getSkill().getName());
            skillDto.setCategory(learningGoal.getSkill().getCategory());
            skillDto.setDescription(learningGoal.getSkill().getDescription());
            dto.setSkill(skillDto);
        }

        return dto;
    }

    private Boolean canCurrentUserContact(Long currentUserId, Long targetUserId) {
        return currentUserId != null && !currentUserId.equals(targetUserId);
    }
}

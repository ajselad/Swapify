package com.example.demo.service;

import com.example.demo.dto.ProfileResponse;
import com.example.demo.dto.ProfileUpdateRequest;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Update completion percentage
        int completionPercentage = calculateProfileCompletionPercentage(user);
        user.setProfileCompletionPercentage(completionPercentage);
        user.setProfileCompleted(completionPercentage >= 80);
        userRepository.save(user);

        return ProfileResponse.fromUser(user);
    }



    public ProfileResponse updateUserProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("🔧 PROFILE UPDATE - User: {} {}", user.getFirstName(), user.getLastName());

        // Update firstName and lastName
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName().trim());
            log.info("✅ Updated firstName to: {}", request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
            log.info("✅ Updated lastName to: {}", request.getLastName());
        }

        // Update other fields...
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getExperienceLevel() != null) {
            user.setExperienceLevel(request.getExperienceLevel().trim());
        }
        if (request.getPreferredLearningStyle() != null) {
            user.setPreferredLearningStyle(request.getPreferredLearningStyle().trim());
        }
        if (request.getSkills() != null) {
            user.setSkills(request.getSkills().trim());
        }
        if (request.getInterests() != null) {
            user.setInterests(request.getInterests().trim());
        }
        // REMOVED: timezone handling
        if (request.getAvailability() != null) {
            user.setAvailability(request.getAvailability().trim());
        }
        if (request.getHourlyRate() != null) {
            user.setHourlyRate(request.getHourlyRate());
        }
        if (request.getIsLookingToLearn() != null) {
            user.setIsLookingToLearn(request.getIsLookingToLearn());
        }
        if (request.getIsAvailableForTeaching() != null) {
            user.setIsAvailableForTeaching(request.getIsAvailableForTeaching());
        }
        if (request.getWebsite() != null) {
            user.setWebsite(request.getWebsite().trim());
        }
        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl().trim());
        }
        if (request.getGithubUrl() != null) {
            user.setGithubUrl(request.getGithubUrl().trim());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl().trim());
        }

        // Calculate completion percentage
        int completionPercentage = calculateProfileCompletionPercentage(user);
        user.setProfileCompletionPercentage(completionPercentage);
        user.setProfileCompleted(completionPercentage >= 80);

        User savedUser = userRepository.save(user);
        log.info("✅ Profile updated: {} {}", savedUser.getFirstName(), savedUser.getLastName());

        return ProfileResponse.fromUser(savedUser);
    }

    private String buildFullName(String firstName, String lastName) {
        if (firstName != null && lastName != null) {
            return (firstName + " " + lastName).trim();
        } else if (firstName != null) {
            return firstName.trim();
        } else if (lastName != null) {
            return lastName.trim();
        }
        return "";
    }

    public int calculateProfileCompletionPercentage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return calculateProfileCompletionPercentage(user);
    }

    private int calculateProfileCompletionPercentage(User user) {
        int totalFields = 14; // REDUCED from 15 (removed timezone)
        int completedFields = 0;

        // Check each important field
        if (user.getFirstName() != null && !user.getFirstName().trim().isEmpty()) completedFields++;
        if (user.getLastName() != null && !user.getLastName().trim().isEmpty()) completedFields++;
        if (user.getBio() != null && !user.getBio().trim().isEmpty()) completedFields++;
        if (user.getLocation() != null && !user.getLocation().trim().isEmpty()) completedFields++;
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) completedFields++;
        if (user.getDateOfBirth() != null) completedFields++;
        if (user.getExperienceLevel() != null && !user.getExperienceLevel().trim().isEmpty()) completedFields++;
        if (user.getSkills() != null && !user.getSkills().trim().isEmpty()) completedFields++;
        if (user.getInterests() != null && !user.getInterests().trim().isEmpty()) completedFields++;
        // REMOVED: timezone check
        if (user.getAvailability() != null && !user.getAvailability().trim().isEmpty()) completedFields++;
        if (user.getIsLookingToLearn() != null) completedFields++;
        if (user.getIsAvailableForTeaching() != null) completedFields++;
        if (user.getPreferredLearningStyle() != null && !user.getPreferredLearningStyle().trim().isEmpty()) completedFields++;
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) completedFields++;

        return (int) Math.round((double) completedFields / totalFields * 100);
    }
}
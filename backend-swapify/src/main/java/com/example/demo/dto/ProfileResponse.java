package com.example.demo.dto;

import com.example.demo.entity.User;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProfileResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String bio;
    private String location;
    private String phone;
    private LocalDate dateOfBirth;
    private String experienceLevel;
    private String preferredLearningStyle;
    private String skills;
    private String interests;

    private String availability;
    private Double hourlyRate;
    private Boolean isLookingToLearn;
    private Boolean isAvailableForTeaching;
    private String website;
    private String linkedinUrl;
    private String githubUrl;
    private String profileImageUrl;

    private Boolean profileCompleted;
    private Integer profileCompletionPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;



    public static ProfileResponse fromUser(User user) {
        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setBio(user.getBio());
        response.setLocation(user.getLocation());
        response.setPhone(user.getPhone());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setExperienceLevel(user.getExperienceLevel());
        response.setPreferredLearningStyle(user.getPreferredLearningStyle());
        response.setSkills(user.getSkills());
        response.setInterests(user.getInterests());
        response.setAvailability(user.getAvailability());
        response.setHourlyRate(user.getHourlyRate());
        response.setIsLookingToLearn(user.getIsLookingToLearn());
        response.setIsAvailableForTeaching(user.getIsAvailableForTeaching());
        response.setWebsite(user.getWebsite());
        response.setLinkedinUrl(user.getLinkedinUrl());
        response.setGithubUrl(user.getGithubUrl());
        response.setProfileImageUrl(user.getProfileImageUrl());

        response.setProfileCompleted(user.getProfileCompleted());
        response.setProfileCompletionPercentage(user.getProfileCompletionPercentage());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
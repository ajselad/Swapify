package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserPublicProfileDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String profileImageUrl;


    private String bio;
    private String location;
    private String phone;
    private LocalDate dateOfBirth;


    private String experienceLevel;
    private String preferredLearningStyle;
    private String timezone;
    private String availability;
    private Double hourlyRate;


    private Boolean isLookingToLearn;
    private Boolean isAvailableForTeaching;


    private String website;
    private String linkedinUrl;
    private String githubUrl;


    private Boolean isOnline;
    private LocalDateTime lastSeen;
    private Integer profileCompletionPercentage;


    private List<UserSkillDto> skills;
    private List<UserLearningGoalDto> learningGoals;
    private List<String> interests;


    private Boolean canContact;
    private String memberSince;
    private Integer mutualConnectionCount;


    public String getDisplayName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        }
        return "User";
    }

    public String getInitials() {
        StringBuilder initials = new StringBuilder();
        if (firstName != null && !firstName.isEmpty()) {
            initials.append(firstName.charAt(0));
        }
        if (lastName != null && !lastName.isEmpty()) {
            initials.append(lastName.charAt(0));
        }
        return initials.toString().toUpperCase();
    }

    public String getStatusText() {
        if (Boolean.TRUE.equals(isOnline)) {
            return "Online now";
        } else if (lastSeen != null) {

            return "Last seen recently";
        }
        return "Offline";
    }

    public String getProfileCompletionText() {
        if (profileCompletionPercentage == null || profileCompletionPercentage < 50) {
            return "Profile needs completion";
        } else if (profileCompletionPercentage < 80) {
            return "Profile partially complete";
        } else {
            return "Profile complete";
        }
    }
}
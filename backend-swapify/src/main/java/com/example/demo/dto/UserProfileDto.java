package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserProfileDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private String bio;
    private String location;
    private String experienceLevel;
    private Boolean isAvailableForTeaching;
    private Boolean isLookingToLearn;
    private Integer profileCompletionPercentage;
    private List<String> skills;
    private List<String> learningGoals;
    private Integer matchScore;


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
}
package com.example.demo.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    @Size(max = 255, message = "Location cannot exceed 255 characters")
    private String location;

    @Size(max = 255, message = "Phone cannot exceed 255 characters")
    private String phone;

    private LocalDate dateOfBirth;

    @Size(max = 255, message = "Experience level cannot exceed 255 characters")
    private String experienceLevel;

    @Size(max = 255, message = "Preferred learning style cannot exceed 255 characters")
    private String preferredLearningStyle;

    @Size(max = 2000, message = "Skills cannot exceed 2000 characters")
    private String skills;

    @Size(max = 2000, message = "Interests cannot exceed 2000 characters")
    private String interests;

    // REMOVED: @Size(max = 255, message = "Timezone cannot exceed 255 characters")
    // REMOVED: private String timezone;

    @Size(max = 255, message = "Availability cannot exceed 255 characters")
    private String availability;

    private Double hourlyRate;

    private Boolean isLookingToLearn;

    private Boolean isAvailableForTeaching;

    @Size(max = 255, message = "Website URL cannot exceed 255 characters")
    private String website;

    @Size(max = 255, message = "LinkedIn URL cannot exceed 255 characters")
    private String linkedinUrl;

    @Size(max = 255, message = "GitHub URL cannot exceed 255 characters")
    private String githubUrl;

    @Size(max = 255, message = "Profile image URL cannot exceed 255 characters")
    private String profileImageUrl;
}

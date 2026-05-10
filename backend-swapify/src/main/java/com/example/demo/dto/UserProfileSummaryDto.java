package com.example.demo.dto;

import lombok.Data;

@Data
public class UserProfileSummaryDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private Double rating;
    private Integer reviewCount;
    private String experienceLevel;
    private String location;

    public String getDisplayName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        }
        return "User";
    }
}

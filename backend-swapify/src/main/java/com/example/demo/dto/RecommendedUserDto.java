package com.example.demo.dto;

import lombok.Data;

@Data
public class RecommendedUserDto {
    private Long id;
    private String name;
    private String profileImageUrl;
    private String skills;
    private String location;
    private Boolean isOnline;
    private Double rating;
    private Boolean isAvailableForTeaching;
    private Boolean isLookingToLearn;
}
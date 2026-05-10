package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SkillSwapDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String skillLevel;
    private UserProfileSummaryDto teacher;
    private SkillDto skill;
    private Integer duration;
    private Double rating;
    private Integer reviewCount;
    private Boolean isAvailable;
    private String difficulty;
    private List<String> prerequisites;
    private LocalDateTime createdAt;
    private String timeCommitment;
}
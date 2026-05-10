package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SkillDto {
    private Long id;
    private String name;
    private String category;
    private String description;
    private LocalDateTime createdAt;


    private Integer teacherCount;
    private Integer learnerCount;
    private Boolean isPopular;


    public String getDisplayText() {
        return name != null ? name : "Unknown Skill";
    }

    public String getCategoryDisplayText() {
        return category != null ? category : "General";
    }
}
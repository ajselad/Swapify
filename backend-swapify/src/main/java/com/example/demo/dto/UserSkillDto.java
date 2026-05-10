package com.example.demo.dto;

import com.example.demo.entity.SkillLevel;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserSkillDto {
    private Long id;
    private SkillDto skill;
    private SkillLevel level;
    private Integer yearsOfExperience;
    private String description;
    private LocalDateTime createdAt;
}
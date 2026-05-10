package com.example.demo.dto;

import com.example.demo.entity.Priority;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserLearningGoalDto {
    private Long id;
    private SkillDto skill;
    private Priority priority;
    private String reason;
    private Integer timeCommitmentPerWeek;
    private LocalDateTime createdAt;
}
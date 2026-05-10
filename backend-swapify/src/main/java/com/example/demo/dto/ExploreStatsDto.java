package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExploreStatsDto {
    private int totalUsers;
    private int activeTeachers;
    private int totalSkills;
    private int availableSwaps;
    private List<PopularSkillDto> popularSkills;
    private List<String> trendingCategories;

    @Data
    public static class PopularSkillDto {
        private String name;
        private String category;
        private int teacherCount;
        private int learnerCount;
    }
}
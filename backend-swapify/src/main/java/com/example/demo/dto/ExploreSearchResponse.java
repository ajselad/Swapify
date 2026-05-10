package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExploreSearchResponse {
    private List<SkillSwapDto> skillSwaps;
    private List<UserProfileDto> users;
    private SearchMetadata metadata;

    @Data
    public static class SearchMetadata {
        private String searchType;
        private String searchTerm;
        private boolean skillExists;
        private boolean hasTeachers;
        private boolean hasLearners;
        private List<String> suggestedSkills;
        private String message;
        private int totalResults;
        private int totalPages;
        private String resultType;
    }
}

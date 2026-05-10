// Replace your ExploreService.java with this SIMPLIFIED version that shows ALL user skills

package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ExploreService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserLearningGoalRepository userLearningGoalRepository;
    private final SkillRepository skillRepository;

    /**
     * SIMPLIFIED: Search for skill swaps - shows ALL user skills except current user
     */
    public ExploreSearchResponse searchSkillSwaps(String skill, String category, String search,
                                                  Long currentUserId, Pageable pageable) {

        log.info("🔍 SIMPLE SEARCH - Skill: '{}', Category: '{}', Search: '{}', CurrentUser: {}",
                skill, category, search, currentUserId);

        ExploreSearchResponse response = new ExploreSearchResponse();
        ExploreSearchResponse.SearchMetadata metadata = new ExploreSearchResponse.SearchMetadata();

        metadata.setSearchType("skill");
        metadata.setResultType("swaps");

        try {
            // Get ALL user skills from database
            List<UserSkill> allUserSkills = userSkillRepository.findAll();
            log.info("📊 Total UserSkills in database: {}", allUserSkills.size());

            // ONLY filter out current user - no other filtering
            List<UserSkill> filteredSkills = allUserSkills.stream()
                    .filter(us -> !us.getUser().getId().equals(currentUserId))
                    .collect(Collectors.toList());

            log.info("📊 After removing current user: {}", filteredSkills.size());

            // Now apply search filters if provided
            if (skill != null && !skill.trim().isEmpty()) {
                String skillName = skill.trim();
                metadata.setSearchTerm(skillName);

                filteredSkills = filteredSkills.stream()
                        .filter(us -> us.getSkill().getName().equalsIgnoreCase(skillName))
                        .collect(Collectors.toList());

                log.info("📊 After skill filter '{}': {}", skillName, filteredSkills.size());

                if (filteredSkills.isEmpty()) {
                    // Check if skill exists
                    Optional<Skill> skillExists = skillRepository.findByNameIgnoreCase(skillName);
                    if (skillExists.isPresent()) {
                        metadata.setSkillExists(true);
                        metadata.setHasTeachers(false);

                        // Check learning goals
                        List<UserLearningGoal> learners = userLearningGoalRepository
                                .findUsersWantingToLearnSkillExcludingUser(skillExists.get().getId(), currentUserId);

                        if (!learners.isEmpty()) {
                            metadata.setMessage("No teachers found for '" + skillName + "', but " +
                                    learners.size() + " people want to learn it. Be the first to teach!");
                        } else {
                            metadata.setMessage("'" + skillName + "' exists but no one is teaching it yet. Be the first!");
                        }
                    } else {
                        metadata.setSkillExists(false);
                        List<Skill> similarSkills = skillRepository.findByNameContainingIgnoreCase(skillName);
                        if (!similarSkills.isEmpty()) {
                            metadata.setSuggestedSkills(similarSkills.stream()
                                    .map(Skill::getName)
                                    .limit(3)
                                    .collect(Collectors.toList()));
                            metadata.setMessage("Skill '" + skillName + "' not found. Similar skills: " +
                                    String.join(", ", metadata.getSuggestedSkills()));
                        } else {
                            metadata.setMessage("'" + skillName + "' not found. You could be the first to add it!");
                        }
                    }
                } else {
                    metadata.setSkillExists(true);
                    metadata.setHasTeachers(true);
                    metadata.setMessage("Found " + filteredSkills.size() + " teacher(s) for " + skillName);
                }

            } else if (category != null && !category.trim().isEmpty() &&
                    !category.equalsIgnoreCase("All Categories") && !category.equalsIgnoreCase("All")) {

                metadata.setSearchTerm(category);

                filteredSkills = filteredSkills.stream()
                        .filter(us -> us.getSkill().getCategory().equalsIgnoreCase(category))
                        .collect(Collectors.toList());

                log.info("📊 After category filter '{}': {}", category, filteredSkills.size());
                metadata.setMessage("Found " + filteredSkills.size() + " teacher(s) in " + category);

            } else if (search != null && !search.trim().isEmpty()) {
                String searchLower = search.trim().toLowerCase();
                metadata.setSearchTerm(search.trim());

                filteredSkills = filteredSkills.stream()
                        .filter(us -> {
                            // Search in skill name
                            if (us.getSkill().getName().toLowerCase().contains(searchLower)) return true;

                            // Search in user name
                            String userName = (us.getUser().getFirstName() + " " + us.getUser().getLastName()).toLowerCase();
                            if (userName.contains(searchLower)) return true;

                            // Search in description
                            if (us.getDescription() != null && us.getDescription().toLowerCase().contains(searchLower)) return true;

                            return false;
                        })
                        .collect(Collectors.toList());

                log.info("📊 After general search '{}': {}", search, filteredSkills.size());
                metadata.setMessage("Found " + filteredSkills.size() + " result(s) matching '" + search + "'");

            } else {
                // No filters - show all (limited for performance)
                filteredSkills = filteredSkills.stream()
                        .limit(50)
                        .collect(Collectors.toList());
                metadata.setMessage("Showing " + filteredSkills.size() + " available teachers");
            }

            // Debug: Log all found user skills
            log.info("🎯 FINAL RESULTS:");
            filteredSkills.forEach(us -> {
                log.info("   👤 User: {} {} (ID: {}), Skill: {}, Level: {}",
                        us.getUser().getFirstName(),
                        us.getUser().getLastName(),
                        us.getUser().getId(),
                        us.getSkill().getName(),
                        us.getLevel());
            });

            // Apply pagination
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), filteredSkills.size());
            List<UserSkill> paginatedSkills = filteredSkills.subList(start, end);

            // Convert to DTOs
            List<SkillSwapDto> swapDtos = paginatedSkills.stream()
                    .map(this::convertUserSkillToSwapDto)
                    .collect(Collectors.toList());

            response.setSkillSwaps(swapDtos);
            metadata.setTotalResults(filteredSkills.size());
            metadata.setTotalPages((int) Math.ceil((double) filteredSkills.size() / pageable.getPageSize()));
            response.setMetadata(metadata);

            log.info("✅ FINAL RESPONSE - {} total results, {} on this page",
                    filteredSkills.size(), swapDtos.size());

        } catch (Exception e) {
            log.error("❌ Error in searchSkillSwaps: ", e);
            metadata.setMessage("An error occurred while searching. Please try again.");
            response.setSkillSwaps(Collections.emptyList());
            response.setMetadata(metadata);
        }

        return response;
    }

    /**
     * Convert UserSkill to SkillSwapDto - SIMPLIFIED
     */
    private SkillSwapDto convertUserSkillToSwapDto(UserSkill userSkill) {
        SkillSwapDto dto = new SkillSwapDto();

        dto.setId(userSkill.getId());

        // FIXED: Create proper skill object for frontend
        SkillDto skillDto = new SkillDto();
        skillDto.setId(userSkill.getSkill().getId());  // This was missing!
        skillDto.setName(userSkill.getSkill().getName());
        skillDto.setCategory(userSkill.getSkill().getCategory());

        String title = userSkill.getSkill().getName();
        if (userSkill.getLevel() != null) {
            title += " - " + capitalizeFirst(userSkill.getLevel().toString());
        }
        dto.setTitle(title);

        String description = userSkill.getDescription();
        if (description == null || description.trim().isEmpty()) {
            description = "Learn " + userSkill.getSkill().getName() + " with personalized instruction.";
        }
        dto.setDescription(description);

        dto.setCategory(userSkill.getSkill().getCategory());
        dto.setSkillLevel(userSkill.getLevel() != null ? userSkill.getLevel().toString() : "BEGINNER");

        // FIXED: Create proper teacher object for frontend
        UserProfileSummaryDto teacher = new UserProfileSummaryDto();
        teacher.setId(userSkill.getUser().getId());  // This was missing!
        teacher.setFirstName(userSkill.getUser().getFirstName());
        teacher.setLastName(userSkill.getUser().getLastName());
        teacher.setProfileImageUrl(userSkill.getUser().getProfileImageUrl());
        teacher.setLocation(userSkill.getUser().getLocation());
        teacher.setRating(4.5); // Placeholder
        teacher.setReviewCount(15); // Placeholder
        dto.setTeacher(teacher);

        // FIXED: Set the skill object
        dto.setSkill(skillDto);  // This was missing!

        // Other fields
        dto.setDuration(60);
        dto.setTimeCommitment("60 min");
        dto.setIsAvailable(true);
        dto.setRating(4.5);
        dto.setReviewCount(15);
        dto.setDifficulty(userSkill.getLevel() != null ?
                userSkill.getLevel().toString().toLowerCase() : "beginner");
        dto.setCreatedAt(userSkill.getCreatedAt());

        return dto;
    }
    // Helper method
    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    // ===== OTHER METHODS (simplified) =====

    public List<String> getPopularSkills(int limit) {
        try {
            List<Skill> popularSkills = skillRepository.findMostPopularSkills(PageRequest.of(0, limit));
            return popularSkills.stream()
                    .map(Skill::getName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting popular skills", e);
            return Collections.emptyList();
        }
    }

    public List<CategoryStatsDto> getCategoryStats() {
        try {
            List<Object[]> results = skillRepository.getCategoryStats();

            return results.stream()
                    .map(row -> {
                        CategoryStatsDto dto = new CategoryStatsDto();
                        dto.setCategory((String) row[0]);
                        dto.setSkillCount(((Number) row[1]).intValue());
                        dto.setIconClass(getCategoryIcon((String) row[0]));
                        dto.setPopular(((Number) row[1]).intValue() > 2);

                        // Count users in this category
                        long userCount = userSkillRepository.findAll().stream()
                                .filter(us -> us.getSkill().getCategory().equals((String) row[0]))
                                .count();
                        dto.setUserCount((int) userCount);
                        dto.setSwapCount((int) userCount);

                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting category stats", e);
            return Collections.emptyList();
        }
    }

    public ExploreStatsDto getExploreStats() {
        ExploreStatsDto stats = new ExploreStatsDto();

        try {
            stats.setTotalUsers((int) userRepository.count());
            stats.setActiveTeachers((int) userRepository.count());
            stats.setTotalSkills((int) skillRepository.count());
            stats.setAvailableSwaps((int) userSkillRepository.count());
            stats.setPopularSkills(Collections.emptyList());
            stats.setTrendingCategories(Collections.emptyList());
        } catch (Exception e) {
            log.error("Error getting stats", e);
        }

        return stats;
    }

    public List<SkillSwapDto> getRecommendedSwaps(Long currentUserId, int limit) {
        try {
            // Just return some random skills for now
            List<UserSkill> someSkills = userSkillRepository.findAll().stream()
                    .filter(us -> !us.getUser().getId().equals(currentUserId))
                    .limit(limit)
                    .collect(Collectors.toList());

            return someSkills.stream()
                    .map(this::convertUserSkillToSwapDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting recommendations", e);
            return Collections.emptyList();
        }
    }

    public List<SkillDto> getSkillSuggestions(String query, int limit) {
        try {
            List<Skill> skills = skillRepository.findByNameContainingIgnoreCase(query);

            return skills.stream()
                    .limit(limit)
                    .map(skill -> {
                        SkillDto dto = new SkillDto();
                        dto.setId(skill.getId());
                        dto.setName(skill.getName());
                        dto.setCategory(skill.getCategory());
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting skill suggestions", e);
            return Collections.emptyList();
        }
    }

    public TrendingDataDto getTrendingData() {
        TrendingDataDto trending = new TrendingDataDto();
        trending.setSkills(getPopularSkills(5));
        trending.setCategories(Collections.emptyList());
        trending.setUsers(Collections.emptyList());
        return trending;
    }

    private String getCategoryIcon(String category) {
        Map<String, String> icons = Map.of(
                "Programming", "💻",
                "Design", "🎨",
                "Languages", "🗣️",
                "Music", "🎵",
                "Business", "💼",
                "Fitness", "💪"
        );
        return icons.getOrDefault(category, "📚");
    }

    // Compatibility methods
    public ExploreSearchResponse searchUsers(String search, String category, String location,
                                             Boolean availableToTeach, Boolean lookingToLearn,
                                             Long currentUserId, Pageable pageable) {
        return searchSkillSwaps(null, category, search, currentUserId, pageable);
    }

    public ExploreSearchResponse searchCommunity(String search, String skill, String category,
                                                 String location, Boolean availableToTeach,
                                                 Boolean lookingToLearn, String searchType,
                                                 Long currentUserId, Pageable pageable) {
        return searchSkillSwaps(skill, category, search, currentUserId, pageable);
    }
}
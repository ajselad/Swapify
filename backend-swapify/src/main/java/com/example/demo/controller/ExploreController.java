// Updated ExploreController.java (remove skill_swaps references)

package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.ExploreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/explore")
@RequiredArgsConstructor
@Slf4j
public class ExploreController {

    private final ExploreService exploreService;


    @GetMapping("/swaps")
    public ResponseEntity<ExploreSearchResponse> getSkillSwaps(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal User currentUser) {

        log.info("Skill swaps request - Skill: {}, Category: {}, Search: {}, User: {}",
                skill, category, search, currentUser.getEmail());

        Pageable pageable = PageRequest.of(page, size);

        ExploreSearchResponse response = exploreService.searchSkillSwaps(
                skill, category, search, currentUser.getId(), pageable);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/users")
    public ResponseEntity<ExploreSearchResponse> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Boolean availableToTeach,
            @RequestParam(required = false) Boolean lookingToLearn,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal User currentUser) {

        log.info("Users search request - Search: {}, Location: {}, User: {}",
                search, location, currentUser.getEmail());

        Pageable pageable = PageRequest.of(page, size);

        ExploreSearchResponse response = exploreService.searchUsers(
                search, category, location, availableToTeach,
                lookingToLearn, currentUser.getId(), pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<SkillSwapDto>> getRecommendedSwaps(
            @RequestParam(defaultValue = "6") int limit,
            @AuthenticationPrincipal User currentUser) {

        log.info("Getting recommendations for user: {}", currentUser.getEmail());

        List<SkillSwapDto> recommendations = exploreService.getRecommendedSwaps(
                currentUser.getId(), limit);

        return ResponseEntity.ok(recommendations);
    }


    @GetMapping("/popular-skills")
    public ResponseEntity<List<String>> getPopularSkills(
            @RequestParam(defaultValue = "10") int limit) {

        List<String> popularSkills = exploreService.getPopularSkills(limit);
        return ResponseEntity.ok(popularSkills);
    }


    @GetMapping("/categories")
    public ResponseEntity<List<CategoryStatsDto>> getCategories() {

        List<CategoryStatsDto> categories = exploreService.getCategoryStats();
        return ResponseEntity.ok(categories);
    }


    @GetMapping("/stats")
    public ResponseEntity<ExploreStatsDto> getExploreStats(
            @AuthenticationPrincipal User currentUser) {

        log.info("Getting explore stats for user: {}", currentUser.getEmail());

        ExploreStatsDto stats = exploreService.getExploreStats();
        return ResponseEntity.ok(stats);
    }


    @GetMapping("/skill-suggestions")
    public ResponseEntity<List<SkillDto>> getSkillSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {

        log.info("Skill suggestions request for query: {}", query);

        List<SkillDto> suggestions = exploreService.getSkillSuggestions(query, limit);
        return ResponseEntity.ok(suggestions);
    }


    @GetMapping("/categories/{category}/swaps")
    public ResponseEntity<ExploreSearchResponse> getSwapsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal User currentUser) {

        log.info("Getting swaps for category: {} by user: {}", category, currentUser.getEmail());

        Pageable pageable = PageRequest.of(page, size);

        ExploreSearchResponse response = exploreService.searchSkillSwaps(
                null, category, null, currentUser.getId(), pageable);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/trending")
    public ResponseEntity<TrendingDataDto> getTrendingData() {

        TrendingDataDto trending = exploreService.getTrendingData();
        return ResponseEntity.ok(trending);
    }
}
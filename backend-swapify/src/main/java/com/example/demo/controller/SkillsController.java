package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.entity.UserSkill;
import com.example.demo.entity.UserLearningGoal;
import com.example.demo.service.SkillsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Slf4j
public class SkillsController {

    private final SkillsService skillService;



    @GetMapping("/my-skills")
    public ResponseEntity<List<UserSkillDto>> getMySkills(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching skills for user: {}", currentUser.getEmail());

        try {
            List<UserSkillDto> skills = skillService.getUserSkills(currentUser.getId());
            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            log.error("Failed to fetch skills for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-goals")
    public ResponseEntity<List<UserLearningGoalDto>> getMyGoals(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching learning goals for user: {}", currentUser.getEmail());

        try {
            List<UserLearningGoalDto> goals = skillService.getUserLearningGoals(currentUser.getId());
            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            log.error("Failed to fetch goals for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/user/{userId}/skills")
    public ResponseEntity<List<UserSkillDto>> getUserSkills(@PathVariable Long userId) {
        log.info("Fetching skills for user: {}", userId);

        try {
            List<UserSkillDto> skills = skillService.getUserSkills(userId);
            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            log.error("Failed to fetch skills for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}/goals")
    public ResponseEntity<List<UserLearningGoalDto>> getUserGoals(@PathVariable Long userId) {
        log.info("Fetching learning goals for user: {}", userId);

        try {
            List<UserLearningGoalDto> goals = skillService.getUserLearningGoals(userId);
            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            log.error("Failed to fetch goals for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }



    @PostMapping("/add-skill")
    public ResponseEntity<?> addSkill(
            @AuthenticationPrincipal User currentUser,
            @RequestBody AddSkillRequest request) {

        log.info("Adding skill for user: {} - Skill: {}", currentUser.getEmail(), request.getSkillName());

        try {
            UserSkillDto skill = skillService.addUserSkill(currentUser.getId(), request);
            return ResponseEntity.ok(skill);
        } catch (Exception e) {
            log.error("Failed to add skill for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/add-goal")
    public ResponseEntity<?> addGoal(
            @AuthenticationPrincipal User currentUser,
            @RequestBody AddGoalRequest request) {

        log.info("Adding goal for user: {} - Goal: {}", currentUser.getEmail(), request.getSkillName());

        try {
            UserLearningGoalDto goal = skillService.addUserLearningGoal(currentUser.getId(), request);
            return ResponseEntity.ok(goal);
        } catch (Exception e) {
            log.error("Failed to add goal for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<?> removeSkill(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long skillId) {

        log.info("Removing skill {} for user: {}", skillId, currentUser.getEmail());

        try {
            skillService.removeUserSkill(currentUser.getId(), skillId);
            return ResponseEntity.ok(new MessageResponse("Skill removed successfully"));
        } catch (Exception e) {
            log.error("Failed to remove skill for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/goals/{goalId}")
    public ResponseEntity<?> removeGoal(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long goalId) {

        log.info("Removing goal {} for user: {}", goalId, currentUser.getEmail());

        try {
            skillService.removeUserLearningGoal(currentUser.getId(), goalId);
            return ResponseEntity.ok(new MessageResponse("Learning goal removed successfully"));
        } catch (Exception e) {
            log.error("Failed to remove goal for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }


    @GetMapping("/all")
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        try {
            List<SkillDto> skills = skillService.getAllSkills();
            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            log.error("Failed to fetch all skills", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<SkillDto>> searchSkills(@RequestParam String query) {
        try {
            List<SkillDto> skills = skillService.searchSkills(query);
            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            log.error("Failed to search skills", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<SkillDto>> getSkillsByCategory(@PathVariable String category) {
        try {
            List<SkillDto> skills = skillService.getSkillsByCategory(category);
            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            log.error("Failed to fetch skills by category", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{skillId}")
    public ResponseEntity<SkillDto> getSkill(@PathVariable Long skillId) {
        try {
            SkillDto skill = skillService.getSkill(skillId);
            return ResponseEntity.ok(skill);
        } catch (Exception e) {
            log.error("Failed to fetch skill", e);
            return ResponseEntity.badRequest().build();
        }
    }



    public static class AddSkillRequest {
        private String skillName;
        private String category;
        private String level;
        private Integer yearsOfExperience;
        private String description;


        public String getSkillName() { return skillName; }
        public void setSkillName(String skillName) { this.skillName = skillName; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }

        public Integer getYearsOfExperience() { return yearsOfExperience; }
        public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class AddGoalRequest {
        private String skillName;
        private String category;
        private String priority;
        private String reason;
        private Integer timeCommitmentPerWeek;


        public String getSkillName() { return skillName; }
        public void setSkillName(String skillName) { this.skillName = skillName; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public Integer getTimeCommitmentPerWeek() { return timeCommitmentPerWeek; }
        public void setTimeCommitmentPerWeek(Integer timeCommitmentPerWeek) { this.timeCommitmentPerWeek = timeCommitmentPerWeek; }
    }
}
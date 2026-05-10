package com.example.demo.service;

import com.example.demo.controller.SkillsController;
import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillsService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserLearningGoalRepository userLearningGoalRepository;
    private final UserRepository userRepository;

    // ========== USER SKILLS MANAGEMENT ==========

    @Transactional(readOnly = true)
    public List<UserSkillDto> getUserSkills(Long userId) {
        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        return userSkills.stream()
                .map(this::convertToUserSkillDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserLearningGoalDto> getUserLearningGoals(Long userId) {
        List<UserLearningGoal> learningGoals = userLearningGoalRepository.findByUserId(userId);
        return learningGoals.stream()
                .map(this::convertToUserLearningGoalDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserSkillDto addUserSkill(Long userId, SkillsController.AddSkillRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find or create skill
        Skill skill = skillRepository.findByNameIgnoreCase(request.getSkillName())
                .orElseGet(() -> {
                    Skill newSkill = new Skill();
                    newSkill.setName(request.getSkillName().trim());
                    newSkill.setCategory(request.getCategory());
                    return skillRepository.save(newSkill);
                });

        // Check if user already has this skill
        List<UserSkill> existingSkills = userSkillRepository.findByUserIdAndSkillId(userId, skill.getId());
        if (!existingSkills.isEmpty()) {
            throw new RuntimeException("You already have this skill in your profile");
        }

        // Create user skill
        UserSkill userSkill = new UserSkill();
        userSkill.setUser(user);
        userSkill.setSkill(skill);
        userSkill.setLevel(SkillLevel.valueOf(request.getLevel().toUpperCase()));
        userSkill.setYearsOfExperience(request.getYearsOfExperience());
        userSkill.setDescription(request.getDescription());

        userSkill = userSkillRepository.save(userSkill);

        log.info("Added skill '{}' for user {}", skill.getName(), user.getEmail());
        return convertToUserSkillDto(userSkill);
    }

    @Transactional
    public UserLearningGoalDto addUserLearningGoal(Long userId, SkillsController.AddGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find or create skill
        Skill skill = skillRepository.findByNameIgnoreCase(request.getSkillName())
                .orElseGet(() -> {
                    Skill newSkill = new Skill();
                    newSkill.setName(request.getSkillName().trim());
                    newSkill.setCategory(request.getCategory());
                    return skillRepository.save(newSkill);
                });

        // Check if user already has this learning goal
        List<UserLearningGoal> existingGoals = userLearningGoalRepository.findByUserIdAndSkillId(userId, skill.getId());
        if (!existingGoals.isEmpty()) {
            throw new RuntimeException("You already have this skill as a learning goal");
        }

        // Create learning goal
        UserLearningGoal learningGoal = new UserLearningGoal();
        learningGoal.setUser(user);
        learningGoal.setSkill(skill);
        learningGoal.setPriority(Priority.valueOf(request.getPriority().toUpperCase()));
        learningGoal.setReason(request.getReason());
        learningGoal.setTimeCommitmentPerWeek(request.getTimeCommitmentPerWeek());

        learningGoal = userLearningGoalRepository.save(learningGoal);

        log.info("Added learning goal '{}' for user {}", skill.getName(), user.getEmail());
        return convertToUserLearningGoalDto(learningGoal);
    }

    @Transactional
    public void removeUserSkill(Long userId, Long userSkillId) {
        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        if (!userSkill.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only remove your own skills");
        }

        userSkillRepository.delete(userSkill);
        log.info("Removed skill '{}' for user {}", userSkill.getSkill().getName(), userSkill.getUser().getEmail());
    }

    @Transactional
    public void removeUserLearningGoal(Long userId, Long goalId) {
        UserLearningGoal learningGoal = userLearningGoalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Learning goal not found"));

        if (!learningGoal.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only remove your own learning goals");
        }

        userLearningGoalRepository.delete(learningGoal);
        log.info("Removed learning goal '{}' for user {}", learningGoal.getSkill().getName(), learningGoal.getUser().getEmail());
    }

    // ========== SKILL DISCOVERY ==========

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::convertToSkillDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> searchSkills(String query) {
        return skillRepository.findByNameContainingIgnoreCase(query).stream()
                .map(this::convertToSkillDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category).stream()
                .map(this::convertToSkillDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SkillDto getSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        return convertToSkillDto(skill);
    }

    // ========== CONVERSION METHODS ==========

    private UserSkillDto convertToUserSkillDto(UserSkill userSkill) {
        UserSkillDto dto = new UserSkillDto();
        dto.setId(userSkill.getId());
        dto.setLevel(userSkill.getLevel());
        dto.setYearsOfExperience(userSkill.getYearsOfExperience());
        dto.setDescription(userSkill.getDescription());
        dto.setCreatedAt(userSkill.getCreatedAt());

        // Convert skill
        if (userSkill.getSkill() != null) {
            SkillDto skillDto = convertToSkillDto(userSkill.getSkill());
            dto.setSkill(skillDto);
        }

        return dto;
    }

    private UserLearningGoalDto convertToUserLearningGoalDto(UserLearningGoal learningGoal) {
        UserLearningGoalDto dto = new UserLearningGoalDto();
        dto.setId(learningGoal.getId());
        dto.setPriority(learningGoal.getPriority());
        dto.setReason(learningGoal.getReason());
        dto.setTimeCommitmentPerWeek(learningGoal.getTimeCommitmentPerWeek());
        dto.setCreatedAt(learningGoal.getCreatedAt());

        // Convert skill
        if (learningGoal.getSkill() != null) {
            SkillDto skillDto = convertToSkillDto(learningGoal.getSkill());
            dto.setSkill(skillDto);
        }

        return dto;
    }

    private SkillDto convertToSkillDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setCategory(skill.getCategory());
        dto.setDescription(skill.getDescription());
        dto.setCreatedAt(skill.getCreatedAt());
        return dto;
    }
}
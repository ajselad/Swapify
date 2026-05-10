package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.ParticipantDto;
import com.example.demo.dto.UserPublicProfileDto;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("User search request from: {} with query: '{}'", currentUser.getEmail(), q);

        try {
            if (q.trim().length() < 2) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Search term must be at least 2 characters"));
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<User> users = userRepository.searchUsersAdvanced(q, currentUser.getId(), pageable);

            List<ParticipantDto> userDtos = users.getContent().stream()
                    .map(this::convertToParticipantDto)
                    .collect(Collectors.toList());

            log.info("Found {} users for query: '{}'", userDtos.size(), q);
            return ResponseEntity.ok(userDtos);

        } catch (Exception e) {
            log.error("Error searching users with query: {}", q, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to search users"));
        }
    }


    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserPublicProfile(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Fetching public profile for user: {} by: {}", userId, currentUser.getEmail());

        try {
            UserPublicProfileDto profile = userService.getPublicUserProfile(userId, currentUser.getId());
            return ResponseEntity.ok(profile);

        } catch (RuntimeException e) {
            log.error("Error fetching user profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching user profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch user profile"));
        }
    }


    @GetMapping("/{userId}/basic")
    public ResponseEntity<?> getUserBasicInfo(@PathVariable Long userId) {
        log.info("Fetching basic info for user: {}", userId);

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ParticipantDto userDto = convertToParticipantDto(user);
            return ResponseEntity.ok(userDto);

        } catch (RuntimeException e) {
            log.error("Error fetching user basic info: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching user basic info", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch user info"));
        }
    }

    private ParticipantDto convertToParticipantDto(User user) {
        ParticipantDto dto = new ParticipantDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setProfileImageUrl(user.getProfileImageUrl());

        dto.setIsOnline(user.getIsOnline() != null ? user.getIsOnline() : false);
        dto.setLastSeen(user.getLastSeen() != null ? user.getLastSeen() : LocalDateTime.now().minusHours(1));

        return dto;
    }


    public static class UserSearchDto extends ParticipantDto {
        private String bio;
        private String location;
        private String skills;
        private String displayName;
        private String experienceLevel;
        private Boolean isAvailableForTeaching;
        private Boolean isLookingToLearn;


        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

        public Boolean getIsAvailableForTeaching() { return isAvailableForTeaching; }
        public void setIsAvailableForTeaching(Boolean isAvailableForTeaching) { this.isAvailableForTeaching = isAvailableForTeaching; }

        public Boolean getIsLookingToLearn() { return isLookingToLearn; }
        public void setIsLookingToLearn(Boolean isLookingToLearn) { this.isLookingToLearn = isLookingToLearn; }
    }


    @GetMapping("/search/detailed")
    public ResponseEntity<?> searchUsersDetailed(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Detailed user search request from: {} with query: '{}'", currentUser.getEmail(), q);

        try {
            if (q.trim().length() < 2) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Search term must be at least 2 characters"));
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<User> users = userRepository.searchUsersAdvanced(q, currentUser.getId(), pageable);

            List<UserSearchDto> userDtos = users.getContent().stream()
                    .map(this::convertToUserSearchDto)
                    .collect(Collectors.toList());

            log.info("Found {} detailed users for query: '{}'", userDtos.size(), q);
            return ResponseEntity.ok(userDtos);

        } catch (Exception e) {
            log.error("Error in detailed user search with query: {}", q, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to search users"));
        }
    }

    private UserSearchDto convertToUserSearchDto(User user) {
        UserSearchDto dto = new UserSearchDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setDisplayName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        dto.setLocation(user.getLocation());
        dto.setSkills(user.getSkills());
        dto.setExperienceLevel(user.getExperienceLevel());
        dto.setIsAvailableForTeaching(user.getIsAvailableForTeaching());
        dto.setIsLookingToLearn(user.getIsLookingToLearn());


        if (user.getBio() != null && !user.getBio().trim().isEmpty()) {
            dto.setBio(user.getBio().length() > 150 ?
                    user.getBio().substring(0, 150) + "..." : user.getBio());
        }


        dto.setIsOnline(user.getIsOnline() != null ? user.getIsOnline() : false);
        dto.setLastSeen(user.getLastSeen() != null ? user.getLastSeen() : LocalDateTime.now().minusHours(1));

        return dto;
    }
}
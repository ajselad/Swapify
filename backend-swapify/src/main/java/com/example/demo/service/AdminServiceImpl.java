package com.example.demo.service;

import com.example.demo.dto.AdminUserDto;
import com.example.demo.entity.User;
import com.example.demo.entity.User.UserRole;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;

    @Override
    public Map<String, Object> getDashboardStatistics() {
        log.info("Getting dashboard statistics");

        try {
            long totalUsers = userRepository.count();
            log.info("Total users: {}", totalUsers);

            long verifiedUsers;
            try {
                verifiedUsers = userRepository.countVerifiedUsers();
                log.info("Verified users: {}", verifiedUsers);
            } catch (Exception e) {
                log.error("Error counting verified users", e);
                verifiedUsers = 0;
            }

            long activeTeachers;
            try {
                activeTeachers = userRepository.countActiveTeachers();
                log.info("Active teachers: {}", activeTeachers);
            } catch (Exception e) {
                log.error("Error counting active teachers", e);
                activeTeachers = 0;
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("verifiedUsers", verifiedUsers);
            stats.put("activeTeachers", activeTeachers);

            log.info("Dashboard statistics compiled successfully");
            return stats;

        } catch (Exception e) {
            log.error("Error getting dashboard statistics", e);
            throw new RuntimeException("Failed to get dashboard statistics: " + e.getMessage());
        }
    }

    @Override
    public Page<AdminUserDto> getAllUsers(Pageable pageable, String search, String filter) {
        log.info("Getting all users with search: '{}', page: {}, size: {}", search, pageable.getPageNumber(), pageable.getPageSize());

        try {
            Page<User> usersPage;

            if (search != null && !search.trim().isEmpty()) {
                log.info("Performing search for: '{}'", search.trim());
                try {
                    usersPage = userRepository.searchUsersAdvanced(search.trim(), -1L, pageable);
                } catch (Exception e) {
                    log.error("Error in advanced search, falling back to findAll", e);
                    usersPage = userRepository.findAll(pageable);
                }
            } else {
                usersPage = userRepository.findAll(pageable);
            }

            log.info("Found {} users", usersPage.getTotalElements());
            return usersPage.map(this::mapUserToAdminUserDto);

        } catch (Exception e) {
            log.error("Error getting users list", e);
            throw new RuntimeException("Failed to get users list: " + e.getMessage());
        }
    }

    @Override
    public AdminUserDto getUserDetails(Long userId) {
        log.info("Getting user details for userId: {}", userId);

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            AdminUserDto dto = mapUserToAdminUserDto(user);
            log.info("Successfully retrieved user details for: {}", user.getEmail());
            return dto;

        } catch (Exception e) {
            log.error("Error getting user details for userId: {}", userId, e);
            throw new RuntimeException("Failed to get user details: " + e.getMessage());
        }
    }

    @Override
    public User promoteToAdmin(Long userId, Long currentAdminId) {
        log.info("Promoting user {} to admin by admin {}", userId, currentAdminId);

        try {
            validateAdminAction(currentAdminId, userId, "promote");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            if (user.getRole() == UserRole.ADMIN) {
                throw new RuntimeException("User is already an admin");
            }

            user.setRole(UserRole.ADMIN);
            User savedUser = userRepository.save(user);

            log.info("Successfully promoted user {} ({}) to admin", userId, user.getEmail());
            return savedUser; // Return the updated user

        } catch (Exception e) {
            log.error("Error promoting user {} to admin", userId, e);
            throw new RuntimeException("Failed to promote user: " + e.getMessage());
        }
    }

    @Override
    public User removeAdminPrivileges(Long userId, Long currentAdminId) {
        log.info("Removing admin privileges from user {} by admin {}", userId, currentAdminId);

        try {
            validateAdminAction(currentAdminId, userId, "demote");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            if (user.getRole() != UserRole.ADMIN) {
                throw new RuntimeException("User is not an admin");
            }

            user.setRole(UserRole.USER);
            User savedUser = userRepository.save(user);

            log.info("Successfully removed admin privileges from user {} ({})", userId, user.getEmail());
            return savedUser; // Return the updated user

        } catch (Exception e) {
            log.error("Error removing admin privileges from user {}", userId, e);
            throw new RuntimeException("Failed to remove admin privileges: " + e.getMessage());
        }
    }

    @Override
    public void deleteUser(Long userId, Long currentAdminId) {
        log.info("Deleting user {} by admin {}", userId, currentAdminId);

        try {
            validateAdminAction(currentAdminId, userId, "delete");

            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("User not found with id: " + userId);
            }

            userRepository.deleteById(userId);
            log.info("Successfully deleted user {}", userId);

        } catch (Exception e) {
            log.error("Error deleting user {}", userId, e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> toggleUserStatus(Long userId, Long currentAdminId) {
        log.info("Toggling user status for user {} by admin {}", userId, currentAdminId);

        try {
            validateAdminAction(currentAdminId, userId, "toggle-status");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            boolean newStatus = !user.isEnabled();
            user.setEnabled(newStatus);
            User savedUser = userRepository.save(user);

            String message = newStatus ? "User account enabled" : "User account disabled";
            log.info("Successfully toggled status for user {} ({}): {}", userId, user.getEmail(), message);

            // Return both message and updated user data
            Map<String, Object> result = new HashMap<>();
            result.put("message", message);
            result.put("user", mapUserToAdminUserDto(savedUser));

            return result;

        } catch (Exception e) {
            log.error("Error toggling user status for user {}", userId, e);
            throw new RuntimeException("Failed to toggle user status: " + e.getMessage());
        }
    }

    @Override
    public void validateAdminAction(Long currentAdminId, Long targetUserId, String action) {
        log.debug("Validating admin action '{}' by admin {} on user {}", action, currentAdminId, targetUserId);

        if (currentAdminId.equals(targetUserId)) {
            throw new RuntimeException("Admin cannot " + action + " themselves");
        }

        User currentAdmin = userRepository.findById(currentAdminId)
                .orElseThrow(() -> new RuntimeException("Current admin user not found with id: " + currentAdminId));

        if (currentAdmin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Current user does not have admin privileges");
        }

        log.debug("Admin action validation passed for '{}' by {}", action, currentAdmin.getEmail());
    }

    private AdminUserDto mapUserToAdminUserDto(User user) {
        try {
            return AdminUserDto.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .enabled(user.isEnabled())
                    .emailVerified(user.isEmailVerified())
                    .role(user.getRole())
                    .isOnline(user.getIsOnline() != null ? user.getIsOnline() : false)
                    .lastSeen(user.getLastSeen())
                    .createdAt(user.getCreatedAt())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping user to DTO: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to map user data");
        }
    }
}
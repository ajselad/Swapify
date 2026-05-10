package com.example.demo.controller;

import com.example.demo.dto.AdminUserDto;
import com.example.demo.dto.MessageResponse;
import com.example.demo.entity.User;
import com.example.demo.service.AdminService;
import com.example.demo.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final JwtService jwtService;


    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(@AuthenticationPrincipal User currentUser) {
        log.info("Admin dashboard stats requested by: {}", currentUser.getEmail());

        try {
            Map<String, Object> stats = adminService.getDashboardStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch dashboard statistics"));
        }
    }


    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter) {

        log.info("Admin {} requesting users list", currentUser.getEmail());

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ?
                    Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<AdminUserDto> users = adminService.getAllUsers(pageable, search, filter);

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching users for admin", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch users"));
        }
    }


    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserDetails(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Admin {} requesting details for user: {}", currentUser.getEmail(), userId);

        try {
            AdminUserDto user = adminService.getUserDetails(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching user details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch user details"));
        }
    }


    @PostMapping("/users/{userId}/promote")
    public ResponseEntity<?> promoteToAdmin(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Admin {} promoting user {} to admin", currentUser.getEmail(), userId);

        try {
            User updatedUser = adminService.promoteToAdmin(userId, currentUser.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User promoted to admin successfully");


            // If the promoted user is the current user, generate new token
            if (currentUser.getId().equals(userId)) {
                String newToken = jwtService.generateToken(updatedUser);
                response.put("token", newToken);
                log.info("Generated new token for promoted admin: {}", updatedUser.getEmail());
            }

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error promoting user to admin", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to promote user"));
        }
    }


    @PostMapping("/users/{userId}/demote")
    public ResponseEntity<?> removeAdminPrivileges(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Admin {} removing admin privileges from user {}", currentUser.getEmail(), userId);

        try {
            User updatedUser = adminService.removeAdminPrivileges(userId, currentUser.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Admin privileges removed successfully");


            if (currentUser.getId().equals(userId)) {
                String newToken = jwtService.generateToken(updatedUser);
                response.put("token", newToken);
                log.info("Generated new token for demoted user: {}", updatedUser.getEmail());
            }

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error removing admin privileges", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to remove admin privileges"));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.warn("Admin {} requesting deletion of user {}", currentUser.getEmail(), userId);

        try {
            adminService.deleteUser(userId, currentUser.getId());
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete user"));
        }
    }

    @PostMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {

        log.info("Admin {} toggling status for user {}", currentUser.getEmail(), userId);

        try {
            Map<String, Object> result = adminService.toggleUserStatus(userId, currentUser.getId());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error toggling user status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to toggle user status"));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getAdminLogs(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        log.info("Admin {} requesting admin logs", currentUser.getEmail());

        try {


            Map<String, Object> result = new HashMap<>();
            result.put("message", "Admin logs feature coming soon");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching admin logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch admin logs"));
        }
    }


}
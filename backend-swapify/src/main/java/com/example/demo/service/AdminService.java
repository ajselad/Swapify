package com.example.demo.service;

import com.example.demo.dto.AdminUserDto;
import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface AdminService {

    // Dashboard statistics
    Map<String, Object> getDashboardStatistics();

    // User management
    Page<AdminUserDto> getAllUsers(Pageable pageable, String search, String filter);
    AdminUserDto getUserDetails(Long userId);

    // Role management - UPDATED to return User objects
    User promoteToAdmin(Long userId, Long currentAdminId);
    User removeAdminPrivileges(Long userId, Long currentAdminId);

    // User status management - UPDATED to return result with user data
    void deleteUser(Long userId, Long currentAdminId);
    Map<String, Object> toggleUserStatus(Long userId, Long currentAdminId);

    // Validation
    void validateAdminAction(Long currentAdminId, Long targetUserId, String action);
}
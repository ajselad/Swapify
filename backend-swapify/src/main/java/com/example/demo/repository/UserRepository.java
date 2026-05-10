package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmailAndEnabledTrue(String email);


    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByVerificationCode(String verificationCode);
    Optional<User> findByEmailAndEmailVerifiedFalse(String email);
    List<User> findByEmailVerifiedFalseAndVerificationTokenExpiresAtBefore(LocalDateTime dateTime);
    List<User> findByEmailVerifiedFalseAndVerificationCodeExpiresAtBefore(LocalDateTime dateTime);


    @Query("SELECT u FROM User u WHERE u.id != :currentUserId " +
            "AND u.emailVerified = true " +
            "AND u.profileCompletionPercentage >= 50 " +
            "ORDER BY u.profileCompletionPercentage DESC, u.createdAt DESC")
    Page<User> findUsersForExplore(@Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.emailVerified = true " +
            "AND u.profileCompletionPercentage >= 80 " +
            "ORDER BY u.profileCompletionPercentage DESC, u.createdAt DESC")
    Page<User> findUsersWithHighProfileCompletion(Long excludeUserId, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u " +
            "JOIN UserSkill us ON us.user.id = u.id " +
            "WHERE us.skill.id IN :skillIds " +
            "AND u.id != :currentUserId " +
            "AND u.emailVerified = true " +
            "AND u.isAvailableForTeaching = true " +
            "ORDER BY u.profileCompletionPercentage DESC")
    List<User> findUsersWhoCanTeachSkills(@Param("skillIds") List<Long> skillIds,
                                          @Param("currentUserId") Long currentUserId,
                                          @Param("limit") int limit);

    @Query("SELECT DISTINCT u FROM User u " +
            "WHERE u.id != :currentUserId " +
            "AND u.emailVerified = true " +
            "AND u.id IN (" +
            "    SELECT us.user.id FROM UserSkill us WHERE us.skill.id IN :myLearningSkillIds" +
            ") " +
            "AND u.id IN (" +
            "    SELECT ulg.user.id FROM UserLearningGoal ulg WHERE ulg.skill.id IN :myTeachingSkillIds" +
            ") " +
            "ORDER BY u.profileCompletionPercentage DESC")
    List<User> findMutualMatches(@Param("myLearningSkillIds") List<Long> myLearningSkillIds,
                                 @Param("myTeachingSkillIds") List<Long> myTeachingSkillIds,
                                 @Param("currentUserId") Long currentUserId,
                                 @Param("limit") int limit);

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN UserSkill us ON us.user.id = u.id " +
            "LEFT JOIN us.skill s " +
            "WHERE u.id != :currentUserId " +
            "AND u.emailVerified = true " +
            "AND (" +
            "    LOWER(CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, ''))) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(COALESCE(u.location, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(COALESCE(s.category, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(COALESCE(u.bio, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
            ") " +
            "ORDER BY u.profileCompletionPercentage DESC")
    Page<User> searchUsersAdvanced(@Param("searchTerm") String searchTerm,
                                   @Param("currentUserId") Long currentUserId,
                                   Pageable pageable);


    @Query("SELECT COUNT(u) FROM User u WHERE u.emailVerified = true")
    long countVerifiedUsers();

    @Query("SELECT COUNT(DISTINCT u) FROM User u WHERE u.emailVerified = true AND u.isAvailableForTeaching = true")
    long countActiveTeachers();

    @Query("SELECT u FROM User u " +
            "WHERE u.id NOT IN :excludeUserIds " +
            "AND u.enabled = true " +
            "AND u.emailVerified = true " +
            "AND (u.isAvailableForTeaching = true OR u.isLookingToLearn = true) " +
            "ORDER BY u.isOnline DESC, u.lastSeen DESC")
    Page<User> findRecommendedUsers(@Param("currentUserId") Long currentUserId,
                                    @Param("excludeUserIds") Set<Long> excludeUserIds,
                                    Pageable pageable);


    @Query("SELECT u FROM User u " +
            "WHERE u.isAvailableForTeaching = true " +
            "AND u.enabled = true " +
            "AND u.emailVerified = true " +
            "AND u.id != :currentUserId " +
            "ORDER BY u.isOnline DESC, u.lastSeen DESC")
    Page<User> findAvailableTeachers(@Param("currentUserId") Long currentUserId, Pageable pageable);


    @Query("SELECT u FROM User u " +
            "WHERE u.isLookingToLearn = true " +
            "AND u.enabled = true " +
            "AND u.emailVerified = true " +
            "AND u.id != :currentUserId " +
            "ORDER BY u.isOnline DESC, u.lastSeen DESC")
    Page<User> findUsersLookingToLearn(@Param("currentUserId") Long currentUserId, Pageable pageable);
    @Query(value = "SELECT COUNT(*) FROM users WHERE email_verified = true", nativeQuery = true)
    Long countVerifiedUsersSafe();


    @Query(value = "SELECT COUNT(DISTINCT id) FROM users WHERE email_verified = true AND is_available_for_teaching = true", nativeQuery = true)
    Long countActiveTeachersSafe();


    @Query("SELECT COUNT(u) FROM User u WHERE u.emailVerified = true")
    long countEmailVerifiedUsers();


    @Query("SELECT COUNT(u) FROM User u WHERE u.emailVerified = true AND u.isAvailableForTeaching = true")
    long countUsersAvailableForTeaching();
}


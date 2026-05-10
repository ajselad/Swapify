package com.example.demo.repository;

import com.example.demo.entity.Session;
import com.example.demo.entity.Session.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {


    @Query("SELECT s FROM Session s WHERE s.student.id = :userId OR s.teacher.id = :userId")
    Page<Session> findByUserId(@Param("userId") Long userId, Pageable pageable);


    Page<Session> findByStudentId(Long studentId, Pageable pageable);


    Page<Session> findByTeacherId(Long teacherId, Pageable pageable);


    @Query("SELECT s FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) AND s.status = :status")
    List<Session> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);


    @Query("SELECT s FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) " +
            "AND s.status = :status AND s.scheduledAt BETWEEN :now AND :tomorrow")
    List<Session> findUpcomingSessions(@Param("userId") Long userId,
                                       @Param("status") SessionStatus status,
                                       @Param("now") LocalDateTime now,
                                       @Param("tomorrow") LocalDateTime tomorrow);


    @Query("SELECT s FROM Session s WHERE " +
            "(s.teacher.id = :userId AND s.status = 'PENDING') OR " +
            "(s.teacher.id = :userId AND s.status = 'ACCEPTED')")
    List<Session> findSessionsNeedingTeacherAction(@Param("userId") Long userId);


    @Query("SELECT s FROM Session s WHERE s.status = 'COMPLETED' AND " +
            "((s.student.id = :userId AND s.studentRating IS NULL) OR " +
            "(s.teacher.id = :userId AND s.teacherRating IS NULL))")
    List<Session> findSessionsToRate(@Param("userId") Long userId);


    @Query("SELECT COUNT(s) FROM Session s WHERE s.student.id = :userId OR s.teacher.id = :userId")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.student.id = :userId")
    Long countByStudentId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.teacher.id = :userId")
    Long countByTeacherId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) AND s.status = :status")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);


    @Query("SELECT AVG(CASE WHEN s.teacher.id = :userId THEN s.teacherRating ELSE s.studentRating END) " +
            "FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) AND s.status = 'COMPLETED'")
    Double getAverageRatingReceived(@Param("userId") Long userId);

    @Query("SELECT AVG(CASE WHEN s.student.id = :userId THEN s.studentRating ELSE s.teacherRating END) " +
            "FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) AND s.status = 'COMPLETED'")
    Double getAverageRatingGiven(@Param("userId") Long userId);


    @Query("SELECT s FROM Session s WHERE s.student.id = :studentId AND s.teacher.id = :teacherId " +
            "AND s.skill.id = :skillId AND s.status IN ('PENDING', 'ACCEPTED', 'SCHEDULED')")
    List<Session> findActiveSessionsBetweenUsers(@Param("studentId") Long studentId,
                                                 @Param("teacherId") Long teacherId,
                                                 @Param("skillId") Long skillId);

    // Find sessions scheduled for a specific time range
    @Query("SELECT s FROM Session s WHERE s.teacher.id = :teacherId " +
            "AND s.status IN ('SCHEDULED', 'IN_PROGRESS') " +
            "AND s.scheduledAt BETWEEN :startTime AND :endTime")
    List<Session> findTeacherSessionsInTimeRange(@Param("teacherId") Long teacherId,
                                                 @Param("startTime") LocalDateTime startTime,
                                                 @Param("endTime") LocalDateTime endTime);


    @Query("SELECT s FROM Session s WHERE s.status = 'PENDING' AND s.createdAt < :cutoffDate")
    List<Session> findOldPendingSessions(@Param("cutoffDate") LocalDateTime cutoffDate);


    @Query("SELECT s FROM Session s WHERE (s.student.id = :userId OR s.teacher.id = :userId) " +
            "AND (LOWER(s.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(s.skill.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Session> searchUserSessions(@Param("userId") Long userId,
                                     @Param("searchTerm") String searchTerm,
                                     Pageable pageable);

    @Query("SELECT COUNT(s) FROM Session s WHERE " +
            "((s.teacher.id = :userId AND s.studentRating IS NOT NULL) OR " +
            "(s.student.id = :userId AND s.teacherRating IS NOT NULL)) " +
            "AND s.status = 'COMPLETED'")
    Long countCompletedSessionsWithRating(@Param("userId") Long userId);


    @Query("SELECT s FROM Session s " +
            "WHERE (s.student.id = :userId OR s.teacher.id = :userId) " +
            "AND s.scheduledAt > :now " +
            "AND s.status IN ('SCHEDULED', 'ACCEPTED') " +
            "ORDER BY s.scheduledAt ASC")
    Page<Session> findUpcomingSessionsForUser(@Param("userId") Long userId,
                                              @Param("now") LocalDateTime now,
                                              Pageable pageable);


    default Page<Session> findUpcomingSessionsForUser(Long userId, Pageable pageable) {
        return findUpcomingSessionsForUser(userId, LocalDateTime.now(), pageable);
    }


    @Query("SELECT s FROM Session s " +
            "WHERE (s.student.id = :userId OR s.teacher.id = :userId) " +
            "AND s.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY s.createdAt DESC")
    List<Session> findRecentSessions(@Param("userId") Long userId,
                                     @Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);
}


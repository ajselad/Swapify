package com.example.demo.repository;

import com.example.demo.entity.UserLearningGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLearningGoalRepository extends JpaRepository<UserLearningGoal, Long> {
    List<UserLearningGoal> findByUserId(Long userId);
    List<UserLearningGoal> findByUserIdAndSkillId(Long userId, Long skillId);

    @Query("SELECT ulg FROM UserLearningGoal ulg WHERE ulg.skill.id = :skillId AND ulg.user.id != :excludeUserId")
    List<UserLearningGoal> findUsersWantingToLearnSkillExcludingUser(@Param("skillId") Long skillId, @Param("excludeUserId") Long excludeUserId);

    void deleteByUserIdAndSkillId(Long userId, Long skillId);


    @Query("SELECT COUNT(ulg) FROM UserLearningGoal ulg WHERE ulg.skill.category = :category")
    long countBySkillCategory(@Param("category") String category);

    @Query("SELECT ulg.skill.id, COUNT(ulg) FROM UserLearningGoal ulg GROUP BY ulg.skill.id ORDER BY COUNT(ulg) DESC")
    List<Object[]> getLearningGoalPopularityStats();
}
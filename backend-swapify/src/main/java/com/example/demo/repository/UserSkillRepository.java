package com.example.demo.repository;

import com.example.demo.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    List<UserSkill> findByUserId(Long userId);
    List<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);

    @Query("SELECT us FROM UserSkill us WHERE us.skill.id = :skillId AND us.user.id != :excludeUserId")
    List<UserSkill> findUsersWithSkillExcludingUser(@Param("skillId") Long skillId, @Param("excludeUserId") Long excludeUserId);

    void deleteByUserIdAndSkillId(Long userId, Long skillId);


    @Query("SELECT COUNT(us) FROM UserSkill us WHERE us.skill.category = :category")
    long countBySkillCategory(@Param("category") String category);

    @Query("SELECT us.skill.id, COUNT(us) FROM UserSkill us GROUP BY us.skill.id ORDER BY COUNT(us) DESC")
    List<Object[]> getSkillPopularityStats();
}
package com.example.demo.repository;

import com.example.demo.entity.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByNameIgnoreCase(String name);
    List<Skill> findByCategory(String category);
    List<Skill> findByNameContainingIgnoreCase(String name);


    @Query("SELECT s.category, COUNT(s) as skillCount FROM Skill s GROUP BY s.category ORDER BY skillCount DESC")
    List<Object[]> getCategoryStats();

    @Query("SELECT s FROM Skill s WHERE s.id IN " +
            "(SELECT us.skill.id FROM UserSkill us GROUP BY us.skill.id ORDER BY COUNT(us) DESC)")
    List<Skill> findMostPopularSkills(Pageable pageable);

    @Query("SELECT COUNT(DISTINCT us.user.id) FROM UserSkill us WHERE us.skill.category = :category")
    long countUsersInCategory(@Param("category") String category);
}

package com.example.demo.repository;

import com.example.demo.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {


    @Query("SELECT c FROM Conversation c " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND c.isActive = true " +
            "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    Page<Conversation> findByUserIdOrderByLastMessageAt(@Param("userId") Long userId, Pageable pageable);


    @Query("SELECT c FROM Conversation c " +
            "WHERE ((c.participant1.id = :user1Id AND c.participant2.id = :user2Id) " +
            "OR (c.participant1.id = :user2Id AND c.participant2.id = :user1Id)) " +
            "AND c.conversationType = 'DIRECT_MESSAGE'")
    Optional<Conversation> findByParticipants(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);


    @Query("SELECT COUNT(c) FROM Conversation c " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND c.isActive = true")
    Long countByUserId(@Param("userId") Long userId);


    @Query("SELECT DISTINCT c FROM Conversation c " +
            "JOIN Message m ON m.conversation.id = c.id " +
            "LEFT JOIN MessageReadReceipt mrr ON mrr.message.id = m.id AND mrr.user.id = :userId " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND m.sender.id != :userId " +
            "AND mrr.readAt IS NULL " +
            "AND c.isActive = true")
    List<Conversation> findConversationsWithUnreadMessages(@Param("userId") Long userId);



}
package com.example.demo.repository;

import com.example.demo.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {


    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);


    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId " +
            "ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByConversation(@Param("conversationId") Long conversationId, Pageable pageable);


    @Query("SELECT m FROM Message m " +
            "LEFT JOIN MessageReadReceipt mrr ON mrr.message.id = m.id AND mrr.user.id = :userId " +
            "WHERE m.conversation.id = :conversationId " +
            "AND m.sender.id != :userId " +
            "AND mrr.readAt IS NULL " +
            "ORDER BY m.createdAt ASC")
    List<Message> findUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);


    @Query("SELECT COUNT(m) FROM Message m " +
            "LEFT JOIN MessageReadReceipt mrr ON mrr.message.id = m.id AND mrr.user.id = :userId " +
            "WHERE m.conversation.id = :conversationId " +
            "AND m.sender.id != :userId " +
            "AND mrr.readAt IS NULL")
    Long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);


    @Query("SELECT COUNT(m) FROM Message m " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "LEFT JOIN MessageReadReceipt mrr ON mrr.message.id = m.id AND mrr.user.id = :userId " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND m.sender.id != :userId " +
            "AND mrr.readAt IS NULL")
    Long countTotalUnreadMessages(@Param("userId") Long userId);


    @Query("SELECT m FROM Message m " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY m.createdAt DESC")
    Page<Message> searchMessages(@Param("userId") Long userId, @Param("searchTerm") String searchTerm, Pageable pageable);


    @Query("SELECT m FROM Message m " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "WHERE m.sender.id = :userId " +
            "ORDER BY m.createdAt DESC")
    Page<Message> findMessagesByUser(@Param("userId") Long userId, Pageable pageable);


    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.id = :userId")
    Long countMessagesSentByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND m.sender.id != :userId")
    Long countMessagesReceivedByUser(@Param("userId") Long userId);


    @Query("SELECT m FROM Message m " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND m.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY m.createdAt DESC")
    List<Message> findMessagesInDateRange(@Param("userId") Long userId,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);


    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId " +
            "ORDER BY m.createdAt DESC")
    List<Message> findLatestMessageInConversation(@Param("conversationId") Long conversationId, Pageable pageable);
}

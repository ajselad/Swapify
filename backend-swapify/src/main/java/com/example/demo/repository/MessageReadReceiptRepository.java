package com.example.demo.repository;

import com.example.demo.entity.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {


    Optional<MessageReadReceipt> findByMessageIdAndUserId(Long messageId, Long userId);


    List<MessageReadReceipt> findByMessageId(Long messageId);


    @Modifying
    @Query("UPDATE MessageReadReceipt mrr SET mrr.readAt = :readAt " +
            "WHERE mrr.message.conversation.id = :conversationId " +
            "AND mrr.user.id = :userId " +
            "AND mrr.readAt IS NULL")
    int markConversationMessagesAsRead(@Param("conversationId") Long conversationId,
                                       @Param("userId") Long userId,
                                       @Param("readAt") LocalDateTime readAt);


    @Modifying
    @Query("UPDATE MessageReadReceipt mrr SET mrr.deliveredAt = :deliveredAt " +
            "WHERE mrr.message.id = :messageId " +
            "AND mrr.user.id = :userId " +
            "AND mrr.deliveredAt IS NULL")
    int markMessageAsDelivered(@Param("messageId") Long messageId,
                               @Param("userId") Long userId,
                               @Param("deliveredAt") LocalDateTime deliveredAt);


    @Query("SELECT COUNT(mrr) FROM MessageReadReceipt mrr " +
            "WHERE mrr.user.id = :userId AND mrr.readAt IS NULL")
    Long countUnreadByUser(@Param("userId") Long userId);
}
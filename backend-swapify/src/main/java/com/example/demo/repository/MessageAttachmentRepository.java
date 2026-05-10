package com.example.demo.repository;

import com.example.demo.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {


    List<MessageAttachment> findByMessageId(Long messageId);

    @Query("SELECT ma FROM MessageAttachment ma " +
            "JOIN Message m ON ma.message.id = m.id " +
            "WHERE m.conversation.id = :conversationId " +
            "ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findByConversationId(@Param("conversationId") Long conversationId);


    @Query("SELECT ma FROM MessageAttachment ma " +
            "JOIN Message m ON ma.message.id = m.id " +
            "JOIN Conversation c ON m.conversation.id = c.id " +
            "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
            "AND ma.attachmentType = :attachmentType " +
            "ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findAttachmentsByType(@Param("userId") Long userId,
                                                  @Param("attachmentType") String attachmentType);


    @Query("SELECT COALESCE(SUM(ma.fileSize), 0) FROM MessageAttachment ma " +
            "JOIN Message m ON ma.message.id = m.id " +
            "WHERE m.sender.id = :userId")
    Long calculateTotalAttachmentSize(@Param("userId") Long userId);


    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.fileName = :filename")
    List<MessageAttachment> findByFileName(@Param("filename") String filename);


    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.filePath = :filePath")
    List<MessageAttachment> findByFilePath(@Param("filePath") String filePath);
}
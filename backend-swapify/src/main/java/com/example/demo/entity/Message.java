package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    private MessageType messageType = MessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_status")
    private MessageStatus messageStatus = MessageStatus.SENT;

    @Column(name = "is_edited")
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "reply_to_message_id")
    private Long replyToMessageId;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MessageAttachment> attachments;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MessageReadReceipt> readReceipts;

    public enum MessageType {
        TEXT, ATTACHMENT, SYSTEM, EMOJI_ONLY, REPLY
    }

    public enum MessageStatus {
        SENT, DELIVERED, READ, FAILED
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }


    public boolean isReadBy(Long userId) {
        if (readReceipts == null) return false;
        return readReceipts.stream()
                .anyMatch(receipt -> receipt.getUser().getId().equals(userId) && receipt.getReadAt() != null);
    }


    public MessageStatus getStatusForSender(Long recipientId) {
        if (isReadBy(recipientId)) {
            return MessageStatus.READ;
        }

        return MessageStatus.DELIVERED;
    }


    public String getDisplayContent() {
        if (messageType == MessageType.ATTACHMENT && (content == null || content.trim().isEmpty())) {
            return attachments != null && !attachments.isEmpty() ?
                    "📎 " + attachments.get(0).getFileName() : "Attachment";
        }
        return content;
    }
}
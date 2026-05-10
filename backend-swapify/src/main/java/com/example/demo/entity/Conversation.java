package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "participant1_id", nullable = false)
    private User participant1;

    @ManyToOne
    @JoinColumn(name = "participant2_id", nullable = false)
    private User participant2;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type")
    private ConversationType conversationType = ConversationType.DIRECT_MESSAGE;

    @Column(name = "title")
    private String title;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> messages;

    public enum ConversationType {
        DIRECT_MESSAGE, GROUP_CHAT
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }


    public boolean isParticipant(Long userId) {
        return (participant1 != null && participant1.getId().equals(userId)) ||
                (participant2 != null && participant2.getId().equals(userId));
    }

    public User getOtherParticipant(Long userId) {
        if (participant1 != null && participant1.getId().equals(userId)) {
            return participant2;
        } else if (participant2 != null && participant2.getId().equals(userId)) {
            return participant1;
        }
        return null;
    }

    public String getConversationTitle(Long currentUserId) {
        if (title != null && !title.trim().isEmpty()) {
            return title;
        }

        User otherUser = getOtherParticipant(currentUserId);
        return otherUser != null ? otherUser.getFullName() : "Unknown User";
    }
}
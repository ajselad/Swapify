package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_read_receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReadReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;


    @Table(uniqueConstraints = {
            @UniqueConstraint(columnNames = {"message_id", "user_id"})
    })
    public static class MessageReadReceiptConstraints {}


    public boolean isDelivered() {
        return deliveredAt != null;
    }

    public boolean isRead() {
        return readAt != null;
    }

    public void markAsDelivered() {
        if (deliveredAt == null) {
            deliveredAt = LocalDateTime.now();
        }
    }

    public void markAsRead() {
        if (readAt == null) {
            readAt = LocalDateTime.now();

            markAsDelivered();
        }
    }
}
package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ParticipantDto {
    private Long id;
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String profileImageUrl;
    private Boolean isOnline;
    private LocalDateTime lastSeen;
}
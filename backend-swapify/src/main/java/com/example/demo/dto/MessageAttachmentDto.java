package com.example.demo.dto;

import lombok.Data;

@Data
public class MessageAttachmentDto {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String thumbnailUrl;
    private Long fileSize;
    private String mimeType;
    private String attachmentType;
    private String formattedFileSize;
}
package com.example.demo.service;

import com.example.demo.entity.MessageAttachment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${app.file.upload-dir:./uploads/messages}")
    private String uploadDir;

    public MessageAttachment processFileUpload(MultipartFile file) throws IOException {
        log.info("Processing file upload: {}", file.getOriginalFilename());

        // Validate file
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Validate file size (10MB max)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IOException("File size exceeds maximum limit of 10MB");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // Save the file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File saved to: {}", filePath.toAbsolutePath());

        // Create attachment entity
        MessageAttachment attachment = new MessageAttachment();
        attachment.setFileName(originalFilename);
        attachment.setFilePath(uniqueFilename); // Store relative path
        attachment.setFileSize(file.getSize());
        attachment.setMimeType(file.getContentType());

        // Generate URL for accessing the file
        attachment.setFileUrl("/api/messages/files/" + uniqueFilename);

        // Set attachment type
        attachment.setAttachmentType(
                MessageAttachment.getAttachmentTypeFromMimeType(file.getContentType())
        );

        log.info("File uploaded successfully: {} -> {}", originalFilename, uniqueFilename);

        return attachment;
    }

    public void deleteFile(String filePath) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            Path file = uploadPath.resolve(filePath).normalize();

            // Security check
            if (!file.startsWith(uploadPath.toAbsolutePath())) {
                log.warn("Attempted to delete file outside upload directory: {}", file);
                return;
            }

            if (Files.exists(file)) {
                Files.delete(file);
                log.info("File deleted: {}", file);
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }
    // Add this method to your FileUploadService.java


    public void deletePhysicalFile(String filePath) {
        if (filePath == null || filePath.trim().isEmpty()) {
            log.warn("Cannot delete file: file path is null or empty");
            return;
        }

        try {
            // Resolve the full file path
            Path fullPath = Paths.get(uploadDir).resolve(filePath).normalize().toAbsolutePath();
            Path uploadPath = Paths.get(uploadDir).normalize().toAbsolutePath();

            // Security check - ensure file is within upload directory
            if (!fullPath.startsWith(uploadPath)) {
                log.warn("Security violation: attempted to delete file outside upload directory: {}", fullPath);
                return;
            }

            // Delete the file if it exists
            if (Files.exists(fullPath)) {
                Files.delete(fullPath);
                log.info("Successfully deleted physical file: {}", filePath);
            } else {
                log.warn("File not found for deletion: {}", fullPath);
            }

        } catch (IOException e) {
            log.error("Error deleting physical file {}: {}", filePath, e.getMessage(), e);
            // Don't throw exception - file deletion failure shouldn't prevent message deletion
        } catch (Exception e) {
            log.error("Unexpected error deleting physical file {}: {}", filePath, e.getMessage(), e);
        }
    }
}
package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;

    @Value("${app.file.upload-dir:./uploads/messages}")
    private String uploadDir;



    @GetMapping("/conversations")
    public ResponseEntity<?> getUserConversations(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Fetching conversations for user: {}", currentUser.getEmail());

        try {
            List<ConversationDto> conversations = messageService.getUserConversations(
                    currentUser.getId(), page, size);
            return ResponseEntity.ok(conversations);

        } catch (Exception e) {
            log.error("Error fetching conversations for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch conversations"));
        }
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> startConversation(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody StartConversationRequest request) {

        log.info("Starting conversation request from user: {} to user: {}",
                currentUser.getEmail(), request.getRecipientId());

        try {
            ConversationDto conversation = messageService.startConversation(currentUser.getId(), request);
            return ResponseEntity.ok(conversation);

        } catch (RuntimeException e) {
            log.error("Error starting conversation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error starting conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<?> getConversation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long conversationId) {

        log.info("Fetching conversation {} for user: {}", conversationId, currentUser.getEmail());

        try {
            ConversationDto conversation = messageService.getConversation(conversationId, currentUser.getId());
            return ResponseEntity.ok(conversation);

        } catch (RuntimeException e) {
            log.error("Error fetching conversation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch conversation"));
        }
    }

    @PostMapping("/conversations/{conversationId}/archive")
    public ResponseEntity<?> archiveConversation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long conversationId) {

        log.info("Archiving conversation {} for user: {}", conversationId, currentUser.getEmail());

        try {
            messageService.archiveConversation(conversationId, currentUser.getId());
            return ResponseEntity.ok(new MessageResponse("Conversation archived successfully"));

        } catch (RuntimeException e) {
            log.error("Error archiving conversation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error archiving conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to archive conversation"));
        }
    }


    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> getConversationMessages(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        log.info("Fetching messages for conversation {} by user: {}", conversationId, currentUser.getEmail());

        try {
            List<MessageDto> messages = messageService.getConversationMessages(
                    conversationId, currentUser.getId(), page, size);
            return ResponseEntity.ok(messages);

        } catch (RuntimeException e) {
            log.error("Error fetching messages: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error fetching messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch messages"));
        }
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> sendMessage(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long conversationId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "replyToMessageId", required = false) Long replyToMessageId,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {

        log.info("Sending message to conversation {} from user: {}", conversationId, currentUser.getEmail());
        log.info("Content: {}, Attachments count: {}", content, attachments != null ? attachments.size() : 0);

        try {
            if ((content == null || content.trim().isEmpty()) &&
                    (attachments == null || attachments.isEmpty())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Message must have content or attachments"));
            }


            SendMessageRequest request = new SendMessageRequest();
            request.setContent(content != null ? content.trim() : "");
            request.setReplyToMessageId(replyToMessageId);
            request.setAttachments(attachments);

            MessageDto message = messageService.sendMessage(conversationId, currentUser.getId(), request);
            return ResponseEntity.ok(message);

        } catch (RuntimeException e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error sending message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to send message"));
        }
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<?> markConversationAsRead(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long conversationId) {

        log.info("Marking conversation {} as read for user: {}", conversationId, currentUser.getEmail());

        try {
            messageService.markConversationAsRead(conversationId, currentUser.getId());
            return ResponseEntity.ok(new MessageResponse("Conversation marked as read"));

        } catch (RuntimeException e) {
            log.error("Error marking conversation as read: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error marking conversation as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to mark conversation as read"));
        }
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<?> editMessage(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long messageId,
            @RequestBody EditMessageRequest request) {

        log.info("Editing message {} by user: {}", messageId, currentUser.getEmail());

        try {
            MessageDto message = messageService.editMessage(messageId, currentUser.getId(), request.getContent());
            return ResponseEntity.ok(message);

        } catch (RuntimeException e) {
            log.error("Error editing message: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error editing message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to edit message"));
        }
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long messageId) {

        log.info("Deleting message {} by user: {}", messageId, currentUser.getEmail());

        try {
            messageService.deleteMessage(messageId, currentUser.getId());
            return ResponseEntity.ok(new MessageResponse("Message deleted successfully"));

        } catch (RuntimeException e) {
            log.error("Error deleting message: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to delete message"));
        }
    }


    @GetMapping("/files/**")
    public ResponseEntity<Resource> serveFile(
            HttpServletRequest request,
            @AuthenticationPrincipal User currentUser) {

        log.info("FILE REQUEST: URI={}, User={}", request.getRequestURI(),
                currentUser != null ? currentUser.getEmail() : "null");

        if (currentUser == null) {
            log.warn("Unauthenticated file request: {}", request.getRequestURI());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {

            String requestURI = request.getRequestURI();
            String contextPath = "/api/messages/files/";

            int startIndex = requestURI.indexOf(contextPath);
            if (startIndex == -1) {
                log.error("Invalid file request URI: {}", requestURI);
                return ResponseEntity.badRequest().build();
            }

            String filePath = requestURI.substring(startIndex + contextPath.length());
            log.info("Extracted file path: {}", filePath);


            Path file = Paths.get(uploadDir).resolve(filePath).normalize().toAbsolutePath();
            log.info("Full file path: {}", file.toString());


            Path uploadPath = Paths.get(uploadDir).normalize().toAbsolutePath();

            if (!file.startsWith(uploadPath)) {
                log.warn("Security violation: attempted to access file outside upload directory: {}", file);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!Files.exists(file)) {
                log.warn("File not found: {}", file.toString());
                return ResponseEntity.notFound().build();
            }

            if (!Files.isReadable(file)) {
                log.warn("File not readable: {}", file.toString());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }


            boolean hasAccess = messageService.canUserAccessFile(currentUser.getId(), filePath);
            if (!hasAccess) {
                log.warn("User {} denied access to file: {}", currentUser.getEmail(), filePath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);

            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            log.info("Successfully serving file: {} to user: {}", file.getFileName(), currentUser.getEmail());


            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + file.getFileName().toString() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving file from URI: {} for user: {}",
                    request.getRequestURI(), currentUser.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }



    @GetMapping("/search")
    public ResponseEntity<?> searchMessages(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Searching messages for user: {} with query: {}", currentUser.getEmail(), q);

        try {
            List<MessageDto> messages = messageService.searchMessages(currentUser.getId(), q, page, size);
            return ResponseEntity.ok(messages);

        } catch (Exception e) {
            log.error("Error searching messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to search messages"));
        }
    }



    @GetMapping("/stats/conversations")
    public ResponseEntity<?> getConversationStats(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching conversation stats for user: {}", currentUser.getEmail());

        try {
            ConversationStatsDto stats = messageService.getConversationStats(currentUser.getId());
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching conversation stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch conversation statistics"));
        }
    }

    @GetMapping("/stats/messages")
    public ResponseEntity<?> getMessageStats(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching message stats for user: {}", currentUser.getEmail());

        try {
            MessageStatsDto stats = messageService.getMessageStats(currentUser.getId());
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching message stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to fetch message statistics"));
        }
    }



    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsersForMessaging(
            @AuthenticationPrincipal User currentUser,
            @RequestParam String q) {

        log.info("Searching users for messaging by: {} with query: {}", currentUser.getEmail(), q);

        try {
            List<ParticipantDto> users = messageService.searchUsersForMessaging(currentUser.getId(), q);
            return ResponseEntity.ok(users);

        } catch (Exception e) {
            log.error("Error searching users for messaging", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to search users"));
        }
    }


    @PostMapping("/users/last-seen")
    public ResponseEntity<?> updateLastSeen(@AuthenticationPrincipal User currentUser) {
        try {
            messageService.updateLastSeen(currentUser.getId());
            return ResponseEntity.ok(new MessageResponse("Last seen updated"));
        } catch (Exception e) {
            log.error("Error updating last seen", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to update last seen"));
        }
    }




    public static class EditMessageRequest {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
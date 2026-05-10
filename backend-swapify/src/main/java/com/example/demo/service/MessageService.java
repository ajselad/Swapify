package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageReadReceiptRepository readReceiptRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    // ========== CONVERSATION MANAGEMENT ==========

    public List<ConversationDto> getUserConversations(Long userId, int page, int size) {
        log.info("Fetching conversations for user: {}", userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> conversations = conversationRepository
                .findByUserIdOrderByLastMessageAt(userId, pageable);

        return conversations.getContent().stream()
                .map(conversation -> convertToConversationDto(conversation, userId))
                .collect(Collectors.toList());
    }

    public ConversationDto startConversation(Long senderId, StartConversationRequest request) {
        log.info("Starting conversation between users {} and {}", senderId, request.getRecipientId());

        // Check if conversation already exists
        var existingConversation = conversationRepository
                .findByParticipants(senderId, request.getRecipientId());

        if (existingConversation.isPresent()) {
            // Send initial message to existing conversation
            var conversation = existingConversation.get();
            sendMessage(conversation.getId(), senderId,
                    createSendMessageRequest(request.getInitialMessage()));
            return convertToConversationDto(conversation, senderId);
        }

        // Create new conversation
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Conversation conversation = new Conversation();
        conversation.setParticipant1(sender);
        conversation.setParticipant2(recipient);
        conversation.setConversationType(Conversation.ConversationType.DIRECT_MESSAGE);
        conversation.setTitle(request.getTitle());
        conversation.setLastMessageAt(LocalDateTime.now());

        Conversation savedConversation = conversationRepository.save(conversation);

        // Send initial message
        sendMessage(savedConversation.getId(), senderId,
                createSendMessageRequest(request.getInitialMessage()));

        log.info("Created new conversation with ID: {}", savedConversation.getId());
        return convertToConversationDto(savedConversation, senderId);
    }

    public ConversationDto getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(userId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        return convertToConversationDto(conversation, userId);
    }

    // ========== MESSAGE MANAGEMENT ==========

    public MessageDto sendMessage(Long conversationId, Long senderId, SendMessageRequest request) {
        log.info("Sending message to conversation {} from user {}", conversationId, senderId);

        // Validate request
        if (!request.isValid()) {
            throw new RuntimeException("Message must have content or attachments");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(senderId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Create message
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent() != null ? request.getContent().trim() : "");
        message.setReplyToMessageId(request.getReplyToMessageId());

        // Determine message type
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            message.setMessageType(Message.MessageType.ATTACHMENT);
        } else {
            message.setMessageType(Message.MessageType.TEXT);
        }

        Message savedMessage = messageRepository.save(message);

        // Process file attachments if any
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (var file : request.getAttachments()) {
                try {
                    log.info("Processing attachment: {}", file.getOriginalFilename());
                    MessageAttachment attachment = fileUploadService.processFileUpload(file);
                    attachment.setMessage(savedMessage);
                    messageAttachmentRepository.save(attachment);
                    log.info("Attachment saved: {}", attachment.getFileName());
                } catch (Exception e) {
                    log.error("Error processing attachment: {}", file.getOriginalFilename(), e);
                    throw new RuntimeException("Failed to process attachment: " + file.getOriginalFilename());
                }
            }
        }

        // Update conversation last message time
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Create read receipt for the recipient
        User recipient = conversation.getOtherParticipant(senderId);
        if (recipient != null) {
            MessageReadReceipt receipt = new MessageReadReceipt();
            receipt.setMessage(savedMessage);
            receipt.setUser(recipient);
            receipt.markAsDelivered();
            readReceiptRepository.save(receipt);
        }

        log.info("Message sent successfully with ID: {}", savedMessage.getId());

        // Reload message with attachments
        Message messageWithAttachments = messageRepository.findById(savedMessage.getId())
                .orElse(savedMessage);

        return convertToMessageDto(messageWithAttachments);
    }

    public List<MessageDto> getConversationMessages(Long conversationId, Long userId, int page, int size) {
        log.info("Fetching messages for conversation {} by user {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(userId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        return messages.getContent().stream()
                .map(this::convertToMessageDto)
                .collect(Collectors.toList());
    }

    public void markConversationAsRead(Long conversationId, Long userId) {
        log.info("Marking conversation {} as read for user {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(userId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        // Mark all unread messages as read
        int markedCount = readReceiptRepository.markConversationMessagesAsRead(
                conversationId, userId, LocalDateTime.now());

        log.info("Marked {} messages as read in conversation {}", markedCount, conversationId);
    }

    public void deleteMessage(Long messageId, Long userId) {
        log.info("Deleting message {} by user {}", messageId, userId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Access denied: You can only delete your own messages");
        }

        try {
            // Handle attachments before deleting the message
            if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
                log.info("Found {} attachments to handle for message {}",
                        message.getAttachments().size(), messageId);

                // Create a copy of the list to avoid concurrent modification
                List<MessageAttachment> attachmentsToRemove = new ArrayList<>(message.getAttachments());

                for (MessageAttachment attachment : attachmentsToRemove) {
                    try {
                        // Optional: Delete physical file from storage
                        if (attachment.getFilePath() != null && fileUploadService != null) {
                            fileUploadService.deletePhysicalFile(attachment.getFilePath());
                        }

                        // Remove attachment record from database
                        messageAttachmentRepository.delete(attachment);
                        log.info("Deleted attachment: {}", attachment.getFileName());

                    } catch (Exception e) {
                        log.error("Error deleting attachment {} for message {}: {}",
                                attachment.getFileName(), messageId, e.getMessage());
                        // Continue with other attachments even if one fails
                    }
                }

                // Clear the attachments collection
                message.getAttachments().clear();
            }

            // Soft delete - change content and mark as system message
            message.setContent("[Message deleted]");
            message.setMessageType(Message.MessageType.SYSTEM);
            message.setUpdatedAt(LocalDateTime.now());

            // Save the updated message
            Message savedMessage = messageRepository.save(message);

            log.info("Message {} deleted successfully. Content changed to system message.", messageId);

        } catch (Exception e) {
            log.error("Error during message deletion for message {}: {}", messageId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete message: " + e.getMessage());
        }
    }

    public MessageDto editMessage(Long messageId, Long userId, String newContent) {
        log.info("Editing message {} by user {}", messageId, userId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Access denied: You can only edit your own messages");
        }

        // Check if message is not too old (e.g., 24 hours)
        if (message.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
            throw new RuntimeException("Cannot edit messages older than 24 hours");
        }

        message.setContent(newContent.trim());
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        log.info("Message {} edited successfully", messageId);

        return convertToMessageDto(savedMessage);
    }

    // ========== SEARCH AND STATISTICS ==========

    public List<MessageDto> searchMessages(Long userId, String searchTerm, int page, int size) {
        log.info("Searching messages for user {} with term: {}", userId, searchTerm);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.searchMessages(userId, searchTerm, pageable);

        return messages.getContent().stream()
                .map(this::convertToMessageDto)
                .collect(Collectors.toList());
    }

    public ConversationStatsDto getConversationStats(Long userId) {
        log.info("Getting conversation stats for user {}", userId);

        ConversationStatsDto stats = new ConversationStatsDto();

        stats.setTotalConversations(conversationRepository.countByUserId(userId).intValue());
        stats.setUnreadConversations(
                conversationRepository.findConversationsWithUnreadMessages(userId).size());
        stats.setTotalUnreadMessages(
                messageRepository.countTotalUnreadMessages(userId).intValue());
        stats.setActiveConversations(stats.getTotalConversations()); // Assuming all are active
        stats.setArchivedConversations(0);

        return stats;
    }

    public MessageStatsDto getMessageStats(Long userId) {
        log.info("Getting message stats for user {}", userId);

        MessageStatsDto stats = new MessageStatsDto();

        Long sentCount = messageRepository.countMessagesSentByUser(userId);
        Long receivedCount = messageRepository.countMessagesReceivedByUser(userId);

        stats.setTotalMessagesSent(sentCount != null ? sentCount.intValue() : 0);
        stats.setTotalMessagesReceived(receivedCount != null ? receivedCount.intValue() : 0);

        // Get messages in last week and month
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

        List<Message> lastWeekMessages = messageRepository.findMessagesInDateRange(
                userId, oneWeekAgo, LocalDateTime.now());
        List<Message> lastMonthMessages = messageRepository.findMessagesInDateRange(
                userId, oneMonthAgo, LocalDateTime.now());

        stats.setMessagesLastWeek(lastWeekMessages.size());
        stats.setMessagesLastMonth(lastMonthMessages.size());

        return stats;
    }

    // ========== FILE ACCESS AUTHORIZATION ==========

    public boolean canUserAccessFile(Long userId, String filePath) {
        try {
            log.info("Checking file access - User ID: {}, File Path: {}", userId, filePath);

            // Method 1: Search by exact file path
            List<MessageAttachment> attachmentsByPath = messageAttachmentRepository.findByFilePath(filePath);
            log.info("Found {} attachments by exact file path", attachmentsByPath.size());

            for (MessageAttachment attachment : attachmentsByPath) {
                if (canUserAccessAttachment(userId, attachment.getId())) {
                    log.info("User {} has access to file {} via exact path match", userId, filePath);
                    return true;
                }
            }

            // Method 2: Search by filename (extract from path)
            String filename;
            if (filePath.contains("/")) {
                filename = filePath.substring(filePath.lastIndexOf("/") + 1);
            } else {
                filename = filePath;
            }

            List<MessageAttachment> attachmentsByFileName = messageAttachmentRepository.findByFileName(filename);
            log.info("Found {} attachments by filename: {}", attachmentsByFileName.size(), filename);

            for (MessageAttachment attachment : attachmentsByFileName) {
                // Check if the stored file path matches what we're looking for
                if (attachment.getFilePath() != null &&
                        (attachment.getFilePath().equals(filePath) ||
                                attachment.getFilePath().equals(filename))) {

                    if (canUserAccessAttachment(userId, attachment.getId())) {
                        log.info("User {} has access to file {} via filename match", userId, filePath);
                        return true;
                    }
                }
            }

            // Method 3: Check fileUrl field (in case it matches)
            List<MessageAttachment> allAttachments = messageAttachmentRepository.findAll();
            for (MessageAttachment attachment : allAttachments) {
                if (attachment.getFileUrl() != null &&
                        attachment.getFileUrl().contains(filePath)) {

                    if (canUserAccessAttachment(userId, attachment.getId())) {
                        log.info("User {} has access to file {} via URL match", userId, filePath);
                        return true;
                    }
                }
            }

            log.warn("User {} denied access to file {}", userId, filePath);
            return false;

        } catch (Exception e) {
            log.error("Error checking file access for user {} and file {}", userId, filePath, e);
            return false;
        }
    }

    public boolean canUserAccessAttachment(Long userId, Long attachmentId) {
        try {
            Optional<MessageAttachment> attachmentOpt = messageAttachmentRepository.findById(attachmentId);

            if (attachmentOpt.isEmpty()) {
                return false;
            }

            MessageAttachment attachment = attachmentOpt.get();
            Message message = attachment.getMessage();
            Conversation conversation = message.getConversation();

            // Check if user is participant in the conversation
            boolean hasAccess = conversation.getParticipant1().getId().equals(userId) ||
                    conversation.getParticipant2().getId().equals(userId);

            log.info("Access check - User: {}, Attachment: {}, Conversation: {}, Access: {}",
                    userId, attachmentId, conversation.getId(), hasAccess);

            return hasAccess;

        } catch (Exception e) {
            log.error("Error checking attachment access for user {} and attachment {}",
                    userId, attachmentId, e);
            return false;
        }
    }

    // ========== HELPER METHODS ==========

    private ConversationDto convertToConversationDto(Conversation conversation, Long currentUserId) {
        ConversationDto dto = new ConversationDto();
        dto.setId(conversation.getId());
        dto.setConversationType(conversation.getConversationType().toString());
        dto.setTitle(conversation.getTitle());
        dto.setIsActive(conversation.getIsActive());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());

        // Set other participant
        User otherUser = conversation.getOtherParticipant(currentUserId);
        if (otherUser != null) {
            dto.setOtherParticipant(convertToParticipantDto(otherUser));
        }

        // Get last message
        Pageable pageableOne = PageRequest.of(0, 1);
        List<Message> lastMessages = messageRepository.findLatestMessageInConversation(
                conversation.getId(), pageableOne);

        if (!lastMessages.isEmpty()) {
            dto.setLastMessage(convertToMessageDto(lastMessages.get(0)));
        }

        // Count unread messages
        Long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), currentUserId);
        dto.setUnreadCount(unreadCount != null ? unreadCount.intValue() : 0);
        dto.setHasUnread(dto.getUnreadCount() > 0);

        return dto;
    }

    private MessageDto convertToMessageDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType().toString());
        dto.setMessageStatus(message.getMessageStatus().toString());
        dto.setIsEdited(message.getIsEdited());
        dto.setEditedAt(message.getEditedAt());
        dto.setReplyToMessageId(message.getReplyToMessageId());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());

        // Convert attachments if any
        if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
            dto.setAttachments(message.getAttachments().stream()
                    .map(this::convertToAttachmentDto)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private MessageAttachmentDto convertToAttachmentDto(MessageAttachment attachment) {
        MessageAttachmentDto dto = new MessageAttachmentDto();
        dto.setId(attachment.getId());
        dto.setFileName(attachment.getFileName());
        dto.setFileUrl(attachment.getFileUrl());
        dto.setThumbnailUrl(attachment.getThumbnailUrl());
        dto.setFileSize(attachment.getFileSize());
        dto.setMimeType(attachment.getMimeType());
        dto.setAttachmentType(attachment.getAttachmentType().toString());
        dto.setFormattedFileSize(attachment.getFormattedFileSize());
        return dto;
    }

    private ParticipantDto convertToParticipantDto(User user) {
        ParticipantDto dto = new ParticipantDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setProfileImageUrl(user.getProfileImageUrl());

        // FIXED: Use actual user data instead of placeholders
        // For now, everyone is offline until we implement real online tracking
        dto.setIsOnline(false);
        // Use the user's last update time as last seen
        dto.setLastSeen(user.getUpdatedAt());

        return dto;
    }

    private SendMessageRequest createSendMessageRequest(String content) {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent(content);
        return request;
    }

    // ========== USER SEARCH FOR MESSAGING ==========

    public List<ParticipantDto> searchUsersForMessaging(Long currentUserId, String searchTerm) {
        log.info("Searching users for messaging by user {} with term: {}", currentUserId, searchTerm);

        // Use the existing user search from UserRepository
        Pageable pageable = PageRequest.of(0, 20); // Limit to 20 results
        Page<User> users = userRepository.searchUsersAdvanced(searchTerm, currentUserId, pageable);

        return users.getContent().stream()
                .map(this::convertToParticipantDto)
                .collect(Collectors.toList());
    }

    // ========== CONVERSATION UTILITIES ==========

    public void archiveConversation(Long conversationId, Long userId) {
        log.info("Archiving conversation {} for user {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(userId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        // For now, just set as inactive
        conversation.setIsActive(false);
        conversationRepository.save(conversation);

        log.info("Conversation {} archived successfully", conversationId);
    }

    public void unarchiveConversation(Long conversationId, Long userId) {
        log.info("Unarchiving conversation {} for user {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.isParticipant(userId)) {
            throw new RuntimeException("Access denied: You are not a participant in this conversation");
        }

        conversation.setIsActive(true);
        conversationRepository.save(conversation);

        log.info("Conversation {} unarchived successfully", conversationId);
    }
    @Transactional
    public void updateUserOnlineStatus(Long userId, boolean isOnline) {
        log.info("Updating online status for user {} to {}", userId, isOnline);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsOnline(isOnline);
        if (!isOnline) {
            user.setLastSeen(LocalDateTime.now());
        }

        userRepository.save(user);
    }

    @Transactional
    public void updateLastSeen(Long userId) {
        log.info("Updating last seen for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);
    }

}
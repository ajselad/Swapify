package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    public DashboardOverviewDto getDashboardOverview(Long userId) {
        log.info("Building dashboard overview for user: {}", userId);

        DashboardOverviewDto overview = new DashboardOverviewDto();

        // Get recent messages count
        overview.setRecentMessagesCount(getRecentMessagesCount(userId));

        // Get unread messages count
        overview.setUnreadMessagesCount(getUnreadMessagesCount(userId));

        // Get upcoming sessions count
        overview.setUpcomingSessionsCount(getUpcomingSessionsCount(userId));

        // Get active conversations count
        overview.setActiveConversationsCount(getActiveConversationsCount(userId));

        return overview;
    }

    public List<RecentMessageDto> getRecentMessages(Long userId) {
        log.info("Fetching recent messages for user: {}", userId);

        // Get recent conversations with latest messages
        Pageable pageable = PageRequest.of(0, 5);
        var conversations = conversationRepository.findByUserIdOrderByLastMessageAt(userId, pageable);

        return conversations.getContent().stream()
                .map(conversation -> {
                    // Get the latest message from this conversation
                    var latestMessages = messageRepository.findLatestMessageInConversation(
                            conversation.getId(), PageRequest.of(0, 1));

                    if (!latestMessages.isEmpty()) {
                        Message latestMessage = latestMessages.get(0);
                        User otherParticipant = conversation.getOtherParticipant(userId);

                        RecentMessageDto dto = new RecentMessageDto();
                        dto.setConversationId(conversation.getId());
                        dto.setParticipantName(otherParticipant.getFullName());
                        dto.setParticipantAvatar(otherParticipant.getProfileImageUrl());
                        dto.setTimestamp(latestMessage.getCreatedAt());
                        dto.setIsUnread(!latestMessage.isReadBy(userId) && !latestMessage.getSender().getId().equals(userId));
                        dto.setIsFromCurrentUser(latestMessage.getSender().getId().equals(userId));

                        return dto;
                    }
                    return null;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    public List<RecommendedUserDto> getRecommendedUsers(Long userId) {
        log.info("Fetching recommended users for user: {}", userId);

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get users who are available to teach and looking to learn
        // Exclude current user and users they already have conversations with
        var existingConversationUserIds = conversationRepository
                .findByUserIdOrderByLastMessageAt(userId, PageRequest.of(0, 100))
                .getContent()
                .stream()
                .map(conv -> conv.getOtherParticipant(userId).getId())
                .collect(Collectors.toSet());

        existingConversationUserIds.add(userId); // Exclude self

        Pageable pageable = PageRequest.of(0, 10);
        var recommendedUsers = userRepository.findRecommendedUsers(
                userId, existingConversationUserIds, pageable);

        return recommendedUsers.getContent().stream()
                .map(user -> {
                    RecommendedUserDto dto = new RecommendedUserDto();
                    dto.setId(user.getId());
                    dto.setName(user.getFullName());
                    dto.setProfileImageUrl(user.getProfileImageUrl());
                    dto.setSkills(user.getSkills());
                    dto.setLocation(user.getLocation());
                    dto.setIsOnline(user.getIsOnline() != null ? user.getIsOnline() : false);
                    dto.setIsAvailableForTeaching(user.getIsAvailableForTeaching() != null ? user.getIsAvailableForTeaching() : false);
                    dto.setIsLookingToLearn(user.getIsLookingToLearn() != null ? user.getIsLookingToLearn() : false);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<UpcomingSessionDto> getUpcomingSessions(Long userId) {
        log.info("Fetching upcoming sessions for user: {}", userId);

        Pageable pageable = PageRequest.of(0, 5);
        var upcomingSessions = sessionRepository.findUpcomingSessionsForUser(userId, pageable);

        return upcomingSessions.getContent().stream()
                .map(session -> {
                    UpcomingSessionDto dto = new UpcomingSessionDto();
                    dto.setId(session.getId());
                    dto.setSkillName(session.getSkill().getName());
                    dto.setScheduledDateTime(session.getScheduledAt()); // Use scheduledAt field
                    dto.setDuration(session.getDurationMinutes());
                    dto.setStatus(session.getStatus().toString());

                    // Set other participant info
                    User otherUser = session.getStudent().getId().equals(userId)
                            ? session.getTeacher()
                            : session.getStudent();
                    dto.setOtherParticipantName(otherUser.getFullName());
                    dto.setOtherParticipantAvatar(otherUser.getProfileImageUrl());
                    dto.setUserRole(session.getStudent().getId().equals(userId) ? "STUDENT" : "TEACHER");

                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Helper methods
    private Integer getRecentMessagesCount(Long userId) {
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        return messageRepository.findMessagesInDateRange(userId, oneDayAgo, LocalDateTime.now()).size();
    }

    private Integer getUnreadMessagesCount(Long userId) {
        Long count = messageRepository.countTotalUnreadMessages(userId);
        return count != null ? count.intValue() : 0;
    }

    private Integer getUpcomingSessionsCount(Long userId) {
        Pageable pageable = PageRequest.of(0, 100);
        return sessionRepository.findUpcomingSessionsForUser(userId, pageable).getContent().size();
    }

    private Integer getActiveConversationsCount(Long userId) {
        Long count = conversationRepository.countByUserId(userId);
        return count != null ? count.intValue() : 0;
    }




}
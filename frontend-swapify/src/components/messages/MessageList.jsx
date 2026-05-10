import React from 'react';

const MessageList = ({ 
  conversations, 
  activeConversation, 
  onSelectConversation, 
  currentUser 
}) => {
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;
  };

  const getMessagePreview = (lastMessage, currentUserId) => {
    if (!lastMessage) return 'No messages yet';
    
    const isOwnMessage = lastMessage.senderId === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    return prefix + truncateMessage(lastMessage.content);
  };

  if (conversations.length === 0) {
    return (
      <div className="conversations-empty">
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15V9c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
            <path d="M3 9l9 5 9-5"/>
          </svg>
          <h3>No conversations yet</h3>
          <p>Start a conversation with someone to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversations-list">
      {conversations.map((conversation) => {
        const isActive = activeConversation?.id === conversation.id;
        const hasUnread = conversation.unreadCount > 0;
        
        return (
          <div
            key={conversation.id}
            className={`conversation-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-avatar">
              {conversation.otherParticipant.profileImageUrl ? (
                <img
                  src={conversation.otherParticipant.profileImageUrl}
                  alt={conversation.otherParticipant.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-fallback"
                style={{ 
                  display: conversation.otherParticipant.profileImageUrl ? 'none' : 'flex' 
                }}
              >
                {conversation.otherParticipant.name.charAt(0).toUpperCase()}
              </div>
              {conversation.otherParticipant.isOnline && (
                <div className="online-indicator"></div>
              )}
            </div>

            <div className="conversation-content">
              <div className="conversation-header">
                <h3 className="participant-name">
                  {conversation.otherParticipant.name}
                </h3>
                <span className="conversation-time">
                  {conversation.lastMessage && formatMessageTime(conversation.lastMessage.createdAt)}
                </span>
              </div>

              <div className="conversation-preview">
                <p className="last-message">
                  {getMessagePreview(conversation.lastMessage, currentUser?.id)}
                </p>
                {hasUnread && (
                  <span className="unread-count">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}
              </div>

              {conversation.lastMessage?.messageType === 'ATTACHMENT' && (
                <div className="attachment-indicator">
                  <svg className="attachment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  Attachment
                </div>
              )}

              {conversation.lastMessage?.isEdited && (
                <span className="edited-indicator">Edited</span>
              )}
            </div>

            {/* Context menu trigger */}
            <div className="conversation-options">
              <button className="options-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
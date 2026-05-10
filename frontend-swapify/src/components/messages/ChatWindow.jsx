import React, { useState, useRef, useEffect } from 'react';

const ChatWindow = ({ 
  conversation, 
  messages, 
  currentUser, 
  onSendMessage, 
  onRefresh,
  formatLastSeen,
  onDeleteMessage
}) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageOptions && !event.target.closest('.message-actions')) {
        setShowMessageOptions(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMessageOptions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!messageText.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);
    
    try {
      await onSendMessage(messageText, attachments);
      setMessageText('');
      setAttachments([]);
      showNotification('Message sent!', 'success');
    } catch (error) {
      console.error('Failed to send message:', error);
      showNotification('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: getFileType(file.type),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      const removed = newAttachments.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newAttachments;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const toggleMessageOptions = (messageId) => {
    setShowMessageOptions(showMessageOptions === messageId ? null : messageId);
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (onDeleteMessage) {
        onDeleteMessage(messageId);
      }

      showNotification('Message deleted successfully', 'success');
      setShowMessageOptions(null);

    } catch (error) {
      console.error('Failed to delete message:', error);
      showNotification('Failed to delete message', 'error');
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditText(message.content);
    setShowMessageOptions(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const saveEdit = async (messageId) => {
    if (!editText.trim()) {
      showNotification('Message cannot be empty', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/messages/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editText.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (onRefresh) {
        onRefresh();
      }

      showNotification('Message updated successfully', 'success');
      setEditingMessage(null);
      setEditText('');

    } catch (error) {
      console.error('Failed to edit message:', error);
      showNotification('Failed to edit message', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    return 'file';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        );
      case 'video':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23,7 16,12 23,17"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        );
      case 'audio':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        );
      case 'pdf':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14,2 L6,2 C4.9,2 4,2.9 4,4 L4,20 C4,21.1 4.9,22 6,22 L18,22 C19.1,22 20,21.1 20,20 L20,8 L14,2 Z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        );
    }
  };

  const downloadAttachment = async (attachment) => {
    if (!attachment.fileUrl) {
      console.error('No file URL available for attachment:', attachment);
      showNotification('Download failed: No file URL available', 'error');
      return;
    }

    try {
      const downloadBtn = document.querySelector(`[data-attachment-id="${attachment.id}"] .attachment-download-btn`);
      if (downloadBtn) {
        downloadBtn.disabled = true;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token available');
        showNotification('Authentication required for download', 'error');
        return;
      }

      let fileUrl = attachment.fileUrl;
      if (fileUrl.startsWith('/api/')) {
        fileUrl = `http://localhost:8081${fileUrl}`;
      }

      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName || 'download';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(url);
      
      showNotification(`Downloaded: ${attachment.fileName}`, 'success');

    } catch (error) {
      console.error('Download failed:', error);
      showNotification('Download failed. Please try again.', 'error');
      
    } finally {
      const downloadBtn = document.querySelector(`[data-attachment-id="${attachment.id}"] .attachment-download-btn`);
      if (downloadBtn) {
        downloadBtn.disabled = false;
      }
    }
  };

  const showNotification = (message, type) => {
    const existingNotifications = document.querySelectorAll('.message-notification');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });

    const notification = document.createElement('div');
    notification.className = `message-notification ${type === 'success' ? 'success' : 'error'}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 3000);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldShowAvatar = (currentMessage, nextMessage) => {
    if (!nextMessage) return true;
    if (currentMessage.senderId !== nextMessage.senderId) return true;
    
    const currentTime = new Date(currentMessage.createdAt);
    const nextTime = new Date(nextMessage.createdAt);
    const timeDiff = nextTime - currentTime;
    
    return timeDiff > 5 * 60 * 1000;
  };

  const isOwnMessage = (message) => {
    return message.senderId === currentUser?.id;
  };

  const canEditMessage = (message) => {
    if (!isOwnMessage(message)) return false;
    if (message.messageType === 'SYSTEM') return false;
    
    const messageTime = new Date(message.createdAt);
    const now = new Date();
    const hoursDiff = (now - messageTime) / (1000 * 60 * 60);
    
    return hoursDiff < 24;
  };

  const isDeletedMessage = (message) => {
    return message.messageType === 'SYSTEM' && message.content === '[Message deleted]';
  };

  const hasAttachments = (message) => {
    return message.attachments && message.attachments.length > 0;
  };

  const shouldShowAttachments = (message) => {
    return hasAttachments(message) && !isDeletedMessage(message);
  };

  if (!conversation) {
    return (
      <div className="no-conversation">
        <div className="no-conversation-content">
          <svg className="no-conversation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15V9c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
            <path d="M3 9l9 5 9-5"/>
          </svg>
          <h2>Select a conversation</h2>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="chat-window"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(59, 130, 246, 0.1)',
          border: '2px dashed #3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center', color: '#3b82f6' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', fontWeight: '600' }}>
              Drop files here to attach
            </p>
          </div>
        </div>
      )}

      <div className="chat-header">
        <div className="chat-participant-info">
          <div className="participant-avatar">
            {conversation.otherParticipant?.profileImageUrl ? (
              <img
                src={conversation.otherParticipant.profileImageUrl}
                alt={conversation.otherParticipant.name}
              />
            ) : (
              <div className="avatar-fallback">
                {conversation.otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {conversation.otherParticipant?.isOnline && (
              <div className="online-status"></div>
            )}
          </div>
          <div className="participant-details">
            <h2>{conversation.otherParticipant?.name || 'Unknown User'}</h2>
            <p className="participant-status">
              {conversation.otherParticipant?.isOnline ? 'Online' : 
               conversation.otherParticipant?.lastSeen ? 
               `Last seen ${formatLastSeen ? formatLastSeen(conversation.otherParticipant.lastSeen) : formatMessageTime(conversation.otherParticipant.lastSeen)}` : 
               'Offline'}
            </p>
          </div>
        </div>

        <div className="chat-actions">
          <button className="chat-action-btn" onClick={onRefresh} title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          
          <button className="chat-action-btn" title="More options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-content">
              <svg className="no-messages-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15V9c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
                <path d="M3 9l9 5 9-5"/>
              </svg>
              <h3>Start the conversation</h3>
              <p>Send a message to {conversation.otherParticipant?.name}</p>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => {
              const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
              const showAvatar = shouldShowAvatar(message, messages[index + 1]);
              const isOwn = isOwnMessage(message);
              const isEditing = editingMessage === message.id;
              const isDeleted = isDeletedMessage(message);

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{formatMessageDate(message.createdAt)}</span>
                    </div>
                  )}
                  
                  <div className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isDeleted ? 'deleted' : ''}`}>
                    <div className="message-container">
                      {!isOwn && showAvatar && (
                        <div className="message-avatar">
                          {conversation.otherParticipant?.profileImageUrl ? (
                            <img
                              src={conversation.otherParticipant.profileImageUrl}
                              alt={conversation.otherParticipant.name}
                            />
                          ) : (
                            <div className="avatar-fallback small">
                              {conversation.otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`message-bubble ${isDeleted ? 'deleted' : ''}`}>
                        {message.content && !isEditing && (
                          <div className="message-content">
                            {message.content}
                          </div>
                        )}

                        {isEditing && (
                          <div className="edit-message-container">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="edit-message-input"
                              rows="3"
                              maxLength="2000"
                              autoFocus
                            />
                            <div className="edit-message-actions">
                              <button 
                                onClick={() => saveEdit(message.id)}
                                className="save-edit-btn"
                                disabled={!editText.trim()}
                              >
                                Save
                              </button>
                              <button 
                                onClick={cancelEdit}
                                className="cancel-edit-btn"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {shouldShowAttachments(message) && (
                          <div className="message-attachments">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} 
                                   className="attachment" 
                                   data-attachment-id={attachment.id}
                                   onClick={() => downloadAttachment(attachment)}>
                                <div className="attachment-icon">
                                  {getFileIcon(attachment.attachmentType?.toLowerCase() || 'file')}
                                </div>
                                <div className="attachment-file-info">
                                  <span className="attachment-name" title={attachment.fileName}>
                                    {attachment.fileName}
                                  </span>
                                  {attachment.formattedFileSize && (
                                    <span className="attachment-size">{attachment.formattedFileSize}</span>
                                  )}
                                </div>
                                <button 
                                  className="attachment-download-btn" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadAttachment(attachment);
                                  }}
                                  title="Download file"
                                  disabled={!attachment.fileUrl}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {isDeleted && hasAttachments(message) && (
                          <div className="deleted-attachments-indicator">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                              <line x1="18" y1="6" x2="6" y2="18"/>
                            </svg>
                            <span>Attachments removed</span>
                          </div>
                        )}

                        <div className="message-meta">
                          <span className="message-time">
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {message.isEdited && !isDeleted && (
                            <span className="edited-label">Edited</span>
                          )}
                          {isOwn && !isDeleted && (
                            <span className={`message-status ${message.messageStatus?.toLowerCase() || 'sent'}`}>
                              {message.messageStatus === 'read' ? '✓✓' : 
                               message.messageStatus === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>

                      {isOwn && !isDeleted && !isEditing && (
                        <div className="message-actions">
                          <button 
                            className="message-options-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleMessageOptions(message.id);
                            }}
                            title="Message options"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="19" cy="12" r="1"/>
                              <circle cx="5" cy="12" r="1"/>
                            </svg>
                          </button>

                          {showMessageOptions === message.id && (
                            <div className="message-options-menu">
                              {canEditMessage(message) && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startEditMessage(message);
                                  }}
                                  className="message-option-item"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                  Edit
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteMessage(message.id);
                                }}
                                className="message-option-item delete"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>{conversation.otherParticipant?.name} is typing...</span>
        </div>
      )}

      <div className="message-input-container">
        {attachments.length > 0 && (
          <div className="attachments-preview">
            {attachments.map((attachment, index) => (
              <div key={index} className="attachment-preview">
                {attachment.preview ? (
                  <img 
                    src={attachment.preview} 
                    alt={attachment.name}
                    className="attachment-preview-image"
                  />
                ) : (
                  <div className="attachment-icon">
                    {getFileIcon(attachment.type)}
                  </div>
                )}
                <div className="attachment-file-info">
                  <span className="attachment-name">{attachment.name}</span>
                  <span className="attachment-size">{attachment.size}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="remove-attachment"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="message-form" onSubmit={handleSendMessage}>
          <div className="message-input-wrapper">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="attachment-btn"
              title="Attach file"
              disabled={isSending}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message ${conversation.otherParticipant?.name || 'user'}...`}
              className="message-input"
              rows="1"
              maxLength="2000"
              disabled={isSending}
              style={{
                resize: 'none',
                overflow: 'hidden',
                height: 'auto',
                minHeight: '24px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />

            <button
              type="submit"
              disabled={(!messageText.trim() && attachments.length === 0) || isSending}
              className="send-btn"
              title="Send message"
            >
              {isSending ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l3 9-3 9 19-9z"/>
                </svg>
              )}
            </button>
          </div>
        </form>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        />
      </div>
    </div>
  );
};

export default ChatWindow;
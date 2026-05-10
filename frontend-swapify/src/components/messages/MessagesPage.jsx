import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import MessageList from './MessageList';
import ChatWindow from './ChatWindow';
import NewMessageModal from './NewMessageModal';
import '../../assets/styles/messages.css';

const MessagesPage = () => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessagePreset, setNewMessagePreset] = useState(null);

  const abortControllerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const navigationHandledRef = useRef(false);

  useEffect(() => {
    fetchConversations();
    
    pollIntervalRef.current = setInterval(() => {
      fetchConversations(false);
    }, 10000);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle navigation from sessions page
  useEffect(() => {
    if (location.state && conversations.length > 0 && !navigationHandledRef.current) {
      const { activeConversationId, startNewMessageWith } = location.state;
      
      console.log('📍 MessagesPage: Handling navigation state:', location.state);
      
      if (activeConversationId) {
        // Find and set the specific conversation as active
        const targetConversation = conversations.find(conv => conv.id === activeConversationId);
        if (targetConversation) {
          console.log('📍 MessagesPage: Setting active conversation:', targetConversation.id);
          setActiveConversation(targetConversation);
          navigationHandledRef.current = true;
        }
      } else if (startNewMessageWith) {
        // Set up new message modal with preset user
        console.log('📍 MessagesPage: Starting new message with:', startNewMessageWith.name);
        setNewMessagePreset(startNewMessageWith);
        setIsNewMessageModalOpen(true);
        setActiveConversation(null); // Clear any existing conversation
        navigationHandledRef.current = true;
      }
      
      // Clear the state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [conversations, location.state]);

  // SEPARATE useEffect for setting default conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation && !navigationHandledRef.current && !location.state) {
      console.log('📍 MessagesPage: Setting default conversation');
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation, location.state]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markConversationAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const getAuthHeadersForFormData = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const handleApiError = (error, context = '') => {
    console.error(`API Error ${context}:`, error);
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    setError(`Failed to ${context}. Please try again.`);
    setTimeout(() => setError(null), 5000);
  };

  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('http://localhost:8081/api/messages/conversations', {
        headers: getAuthHeaders(),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const sortedConversations = data.sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return new Date(bTime) - new Date(aTime);
      });
      
      setConversations(sortedConversations);
      
      const totalUnread = sortedConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);

      if (sortedConversations.length > 0 && !activeConversation && !navigationHandledRef.current) {
        setActiveConversation(sortedConversations[0]);
      }
      
      if (activeConversation) {
        const updatedActiveConv = sortedConversations.find(conv => conv.id === activeConversation.id);
        if (updatedActiveConv) {
          setActiveConversation(updatedActiveConv);
        }
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        handleApiError(error, 'load conversations');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setMessagesLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:8081/api/messages/conversations/${conversationId}/messages?page=0&size=50`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const sortedMessages = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sortedMessages);

    } catch (error) {
      handleApiError(error, 'load messages');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await fetch(`http://localhost:8081/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0, hasUnread: false }
            : conv
        )
      );

      setUnreadCount(prev => {
        const conversation = conversations.find(c => c.id === conversationId);
        return Math.max(0, prev - (conversation?.unreadCount || 0));
      });

    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const sendMessage = async (messageText, attachments = []) => {
    if (!activeConversation || (!messageText.trim() && attachments.length === 0)) {
      throw new Error('Message cannot be empty');
    }

    try {
      console.log('Sending message with attachments:', attachments);

      const formData = new FormData();
      
      if (messageText && messageText.trim()) {
        formData.append('content', messageText.trim());
      }
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
          if (attachment.file) {
            formData.append('attachments', attachment.file);
          }
        });
      }

      const response = await fetch(
        `http://localhost:8081/api/messages/conversations/${activeConversation.id}/messages`,
        {
          method: 'POST',
          headers: getAuthHeadersForFormData(),
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newMessage = await response.json();
      console.log('Message sent successfully:', newMessage);
      
      setMessages(prev => [...prev, newMessage]);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation.id
            ? {
                ...conv,
                lastMessage: newMessage,
                lastMessageAt: newMessage.createdAt
              }
            : conv
        ).sort((a, b) => {
          const aTime = a.lastMessageAt || a.createdAt;
          const bTime = b.lastMessageAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        })
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      handleApiError(error, 'send message');
      throw error;
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: '[Message deleted]', 
              messageType: 'SYSTEM',
              attachments: []
            }
          : msg
      )
    );

    const deletedMessage = messages.find(msg => msg.id === messageId);
    if (deletedMessage && activeConversation?.lastMessage?.id === messageId) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation.id
            ? {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  content: '[Message deleted]',
                  messageType: 'SYSTEM'
                }
              }
            : conv
        )
      );
    }
  };

  const startNewConversation = async (recipientId, initialMessage) => {
    try {
      const response = await fetch('http://localhost:8081/api/messages/conversations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientId,
          initialMessage: initialMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newConversation = await response.json();
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setIsNewMessageModalOpen(false);
      setNewMessagePreset(null);
      
      setTimeout(() => {
        fetchMessages(newConversation.id);
      }, 100);

    } catch (error) {
      handleApiError(error, 'start conversation');
      throw error;
    }
  };

  const handleRefresh = () => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
    fetchConversations();
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Long ago';
    
    const date = new Date(lastSeen);
    const now = new Date();
    
    if (isNaN(date.getTime())) return 'Unknown';
    
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {error && (
        <div className="message-error-indicator">
          {error}
        </div>
      )}

      <div className="messages-header">
        <div className="header-left">
          <h1>Messages</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <button 
          className="new-message-btn"
          onClick={() => setIsNewMessageModalOpen(true)}
        >
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l3 9-3 9 19-9z"/>
          </svg>
          New Message
        </button>
      </div>

      <div className="messages-layout">
        <div className="conversations-sidebar">
          <div className="conversations-search">
            <div className="search-input-container">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <MessageList
            conversations={filteredConversations}
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
            currentUser={currentUser}
          />
        </div>

        <div className="chat-main">
          {activeConversation ? (
            <>
              {messagesLoading && (
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Loading messages...
                </div>
              )}
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                currentUser={currentUser}
                onSendMessage={sendMessage}
                onRefresh={handleRefresh}
                onDeleteMessage={handleDeleteMessage}
                formatLastSeen={formatLastSeen}
              />
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-content">
                <svg className="no-conversation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15V9c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
                  <path d="M3 9l9 5 9-5"/>
                </svg>
                <h2>Select a conversation</h2>
                <p>Choose from your existing conversations or start a new one</p>
                <button 
                  className="start-chatting-btn"
                  onClick={() => setIsNewMessageModalOpen(true)}
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isNewMessageModalOpen && (
        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => {
            setIsNewMessageModalOpen(false);
            setNewMessagePreset(null);
          }}
          onStartConversation={startNewConversation}
          presetUser={newMessagePreset}
        />
      )}
    </div>
  );
};

export default MessagesPage;
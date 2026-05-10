import React, { useState, useEffect } from 'react';

const NewMessageModal = ({ isOpen, onClose, onStartConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) return;

    setLoading(true);
    try {
      await onStartConversation(selectedUser.id, message);
      // Reset form
      setSelectedUser(null);
      setMessage('');
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.displayName || `${user.firstName} ${user.lastName}`);
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container new-message-modal">
        <div className="modal-header">
          <h2>New Message</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {!selectedUser ? (
            <div className="user-search-section">
              <div className="search-header">
                <h3>Who would you like to message?</h3>
                <p>Search for users to start a conversation</p>
              </div>

              <div className="search-input-container">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>

              {searchLoading && (
                <div className="search-loading">
                  <div className="spinner"></div>
                  <p>Searching users...</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="search-results">
                  <h4>Search Results</h4>
                  <div className="users-list">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="user-item"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="user-avatar">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={user.displayName || `${user.firstName} ${user.lastName}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="avatar-fallback"
                            style={{ 
                              display: user.profileImageUrl ? 'none' : 'flex' 
                            }}
                          >
                            {(user.firstName?.charAt(0) || '').toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="user-info">
                          <h5>{user.displayName || `${user.firstName} ${user.lastName}`}</h5>
                          {user.location && (
                            <p className="user-location">{user.location}</p>
                          )}
                          {user.bio && (
                            <p className="user-bio">{user.bio.substring(0, 100)}...</p>
                          )}
                          {user.skills && (
                            <div className="user-skills">
                              {user.skills.split(',').slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="skill-tag">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="select-user-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchTerm.trim().length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="no-results">
                  <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <h4>No users found</h4>
                  <p>Try searching with different keywords</p>
                </div>
              )}

              {searchTerm.trim().length < 2 && (
                <div className="search-hint">
                  <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p>Type at least 2 characters to start searching</p>
                </div>
              )}
            </div>
          ) : (
            <div className="message-compose-section">
              <div className="recipient-info">
                <div className="recipient-header">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="back-btn"
                    title="Back to search"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <h3>Send message to:</h3>
                </div>

                <div className="selected-recipient">
                  <div className="recipient-avatar">
                    {selectedUser.profileImageUrl ? (
                      <img
                        src={selectedUser.profileImageUrl}
                        alt={selectedUser.displayName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {(selectedUser.firstName?.charAt(0) || '').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="recipient-details">
                    <h4>{selectedUser.displayName || `${selectedUser.firstName} ${selectedUser.lastName}`}</h4>
                    {selectedUser.location && (
                      <p>{selectedUser.location}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="message-input-section">
                <label htmlFor="message-text">Your message:</label>
                <textarea
                  id="message-text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="message-textarea"
                  rows="6"
                  maxLength="2000"
                  autoFocus
                />
                <div className="char-count">
                  {message.length}/2000
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          
          {selectedUser && (
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim() || loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l3 9-3 9 19-9z"/>
                  </svg>
                  Send Message
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
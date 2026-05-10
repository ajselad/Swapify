import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/dashboard.css';
import { AuthContext } from '../../contexts/AuthContext';
import ProfileCompletion from '../profile/ProfileCompletion';
import UserProfile from '../profile/UserProfile'; // Add this import

const Dashboard = () => {
  const { currentUser, userPlan } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    recentMessages: [],
    recommendedUsers: [],
    upcomingSessions: []
  });
  const [loading, setLoading] = useState(true);
  const isPro = userPlan === 'pro';
  
  // Add user profile modal state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
    fetchDashboardData();
  }, []);

  // Add function to open user profile modal
  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setUserProfileModalOpen(true);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/profile/me', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setCompletionPercentage(data.profileCompletionPercentage || 0);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [overviewRes, messagesRes, usersRes, sessionsRes] = await Promise.all([
        fetch('http://localhost:8081/api/dashboard/overview', { headers: getAuthHeaders() }),
        fetch('http://localhost:8081/api/dashboard/recent-messages', { headers: getAuthHeaders() }),
        fetch('http://localhost:8081/api/dashboard/recommended-users', { headers: getAuthHeaders() }),
        fetch('http://localhost:8081/api/dashboard/upcoming-sessions', { headers: getAuthHeaders() })
      ]);

      const [overview, recentMessages, recommendedUsers, upcomingSessions] = await Promise.all([
        overviewRes.ok ? overviewRes.json() : null,
        messagesRes.ok ? messagesRes.json() : [],
        usersRes.ok ? usersRes.json() : [],
        sessionsRes.ok ? sessionsRes.json() : []
      ]);

      setDashboardData({
        overview,
        recentMessages,
        recommendedUsers,
        upcomingSessions
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return currentUser?.name || 'User';
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSessionTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSessionDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Check if it's within the next week
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // For dates further out, show full date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getSkillsArray = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  };

  return (
    <div className="dashboard-wrapper">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar-item active">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          </div>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/explore" className="sidebar-item">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>
          <span>Explore</span>
        </Link>
        
        <Link to="/my-sessions" className="sidebar-item">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <span>My Sessions</span>
        </Link>
        
        <Link to="/messages" className="sidebar-item">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          </div>
          <span>Messages</span>
          {dashboardData.overview?.unreadMessagesCount > 0 && (
            <span className="sidebar-badge">{dashboardData.overview.unreadMessagesCount}</span>
          )}
        </Link>
        
       
        
        <Link to="/profile/settings" className="sidebar-item">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span>Profile</span>
        </Link>
      </aside>
      
      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Header */}
          <header className="header">
            <div>
              <h1 className="welcome-text">Welcome back, {getDisplayName()}!</h1>
            </div>
            
            <div className="header-actions">
              <button className="search-button">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              
              <div className="user-avatar">
                {profileData?.profileImageUrl ? (
                  <img 
                    src={profileData.profileImageUrl} 
                    alt="User avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="default-avatar" 
                  style={{ 
                    display: profileData?.profileImageUrl ? 'none' : 'flex' 
                  }}
                >
                  <span>{getDisplayName().charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Profile Completion Banner - Only shown if profile incomplete */}
          {completionPercentage < 80 && (
            <ProfileCompletion />
          )}
          
          {/* Content Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="left-column">
              
<div className="card">
  <div className="card-header">
    <h2>Upcoming Sessions</h2>
    <Link to="/my-sessions" className="view-all">
      View All
    </Link>
  </div>
  <div className="card-body">
    {loading ? (
      <div className="loading-placeholder">Loading sessions...</div>
    ) : dashboardData.upcomingSessions.length > 0 ? (
      <div className="sessions-list">
        {dashboardData.upcomingSessions.slice(0, 3).map((session) => (
          <div key={session.id} className="session-card">
            <div className="session-header">
              <div className="session-skill-info">
                <h4 className="session-skill">{session.skillName}</h4>
                <span className={`session-status ${session.status.toLowerCase()}`}>
                  {session.status}
                </span>
              </div>
              <div className="session-role">
                {session.userRole === 'STUDENT' ? (
                  <span className="role-badge student">Learning</span>
                ) : (
                  <span className="role-badge teacher">Teaching</span>
                )}
              </div>
            </div>
            
            <div className="session-participant">
              <div className="participant-info">
                <div className="participant-avatar">
                  {session.otherParticipantAvatar ? (
                    <img src={session.otherParticipantAvatar} alt={session.otherParticipantName} />
                  ) : (
                    <div className="avatar-fallback">
                      {session.otherParticipantName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="participant-details">
                  <span 
                    className="participant-name clickable" 
                    onClick={() => openUserProfile(session.otherParticipantId)}
                    style={{ cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}
                  >
                    {session.otherParticipantName}
                  </span>
                  <span className="participant-role">
                    {session.userRole === 'STUDENT' ? 'Teacher' : 'Student'}
                  </span>
                </div>
              </div>
            </div>

            {session.scheduledDateTime ? (
              <div className="session-timing">
                <div className="session-date">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{formatSessionDate(session.scheduledDateTime)}</span>
                </div>
                <div className="session-time">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>{formatSessionTime(session.scheduledDateTime)} ({session.duration}min)</span>
                </div>
              </div>
            ) : (
              <div className="session-timing">
                <span className="not-scheduled">Not yet scheduled</span>
              </div>
            )}

            <div className="session-actions">
              {session.scheduledDateTime && (
                <button className="btn-primary btn-sm">
                  Join Session
                </button>
              )}
              {session.status === 'ACCEPTED' && !session.scheduledDateTime && (
                <button className="btn-secondary btn-sm">
                  Schedule
                </button>
              )}
              {session.status === 'PENDING' && session.userRole === 'TEACHER' && (
                <div className="pending-actions">
                  <button className="btn-success btn-sm">Accept</button>
                  <button className="btn-outline btn-sm">Decline</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <calendar xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </calendar>
        </svg>
        <h4>No upcoming sessions</h4>
        <p>Book a session to start learning or teaching new skills</p>
        <Link to="/explore" className="btn-primary btn-sm">
          Book a Session
        </Link>
      </div>
    )}
  </div>
</div>
              
              {/* Recommended Users */}
              <div className="card">
                <div className="card-header">
                  <h2>{isPro ? 'Recommended Teachers' : 'Recommended Skill Swappers'}</h2>
                  <Link to="/explore" className="view-all">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="loading-placeholder">Loading recommendations...</div>
                  ) : dashboardData.recommendedUsers.length > 0 ? (
                    <div className="tutor-list">
                      {dashboardData.recommendedUsers.slice(0, 3).map((user) => (
                        <div key={user.id} className="tutor-item">
                          <div className="tutor-avatar">
                            {user.profileImageUrl ? (
                              <img src={user.profileImageUrl} alt={user.name} />
                            ) : (
                              <div className="avatar-fallback">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            {user.isOnline && <div className="online-indicator"></div>}
                          </div>
                          <div className="tutor-info">
                            <div className="tutor-name" 
                                 onClick={() => openUserProfile(user.id)}
                                 style={{ cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}>
                              {user.name}
                            </div>
                            <div className="tutor-skill">
                              {getSkillsArray(user.skills).slice(0, 2).join(', ') || 'No skills listed'}
                              {isPro && user.isAvailableForTeaching && <span className="pro-tag">Available</span>}
                            </div>
                            {user.location && <div className="tutor-location">{user.location}</div>}
                          </div>
                          <div className="tutor-rating">
                            <span className="rating-star">★</span> {user.rating.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No recommendations available</p>
                      <Link to="/explore" className="btn-link">Explore users</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="right-column">
              {/* Messages */}
              <div className="card">
                <div className="card-header">
                  <h2>Recent Messages</h2>
                  <Link to="/messages" className="view-all">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="loading-placeholder">Loading messages...</div>
                  ) : dashboardData.recentMessages.length > 0 ? (
                    <div className="message-list">
                      {dashboardData.recentMessages.slice(0, 3).map((msg) => (
                        <Link 
                          key={msg.conversationId} 
                          to="/messages" 
                          className="message-item"
                        >
                          <div className="message-avatar">
                            {msg.participantAvatar ? (
                              <img src={msg.participantAvatar} alt={msg.participantName} />
                            ) : (
                              <div className="avatar-fallback">
                                {msg.participantName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <div 
                                className="message-name clickable"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openUserProfile(msg.participantId);
                                }}
                                style={{ cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}
                              >
                                {msg.participantName}
                              </div>
                              <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
                            </div>
                            <div className="message-meta">
                              <span className="message-content-preview">{msg.messageContent}</span>
                            </div>
                          </div>
                          <div className="message-action">
                            {msg.isUnread && (
                              <span className="unread-badge">New</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No recent messages</p>
                      <Link to="/messages" className="btn-link">Start a conversation</Link>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <h2 className="section-title">Quick Actions</h2>
              <div className="action-cards">
                <Link to="/teach" className="action-card teach-card">
                  <div className="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" width="24" height="24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 11a9 9 0 0 1 9 9"></path>
                      <path d="M4 4a16 16 0 0 1 16 16"></path>
                      <circle cx="5" cy="19" r="1"></circle>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">Teach</div>
                    <div className="action-subtitle">a skill</div>
                  </div>
                  <div className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
                
                <Link to="/explore" className="action-card book-card">
                  <div className="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" width="24" height="24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">Book</div>
                    <div className="action-subtitle">a session</div>
                  </div>
                  <div className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              </div>
              
              {/* Explore Skills */}
              <h2 className="section-title">Explore Skills</h2>
              <div className="action-cards">
                <Link to="/explore" className="action-card explore-card">
                  <div className="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" width="24" height="24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                  </div>
                  <div className="action-content">
                    <div className="action-title">Explore</div>
                    <div className="action-subtitle">Skills</div>
                  </div>
                  <div className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Dashboard Stats - New section */}
              

              
            </div>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfile
        userId={selectedUserId}
        isOpen={userProfileModalOpen}
        onClose={() => {
          setUserProfileModalOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
};

export default Dashboard;
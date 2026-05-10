import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI, handleApiError } from '../../services/apiService';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageCircle, 
  Video,
  TrendingUp,
  Clock3,
  Calendar1,
  Award
} from 'lucide-react';
import '../../assets/styles/sessionsdashboard.css';

const SessionsDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Modal states
  const [scheduleModal, setScheduleModal] = useState({ open: false, session: null });
  const [ratingModal, setRatingModal] = useState({ open: false, session: null });

  useEffect(() => {
    fetchData();
  }, [currentPage, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsData, statsData] = await Promise.all([
        sessionsAPI.getUserSessions(currentPage, 10),
        sessionsAPI.getSessionStats()
      ]);
      
      setSessions(sessionsData.content || sessionsData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleAcceptSession = async (sessionId) => {
    try {
      await sessionsAPI.respondToSession(sessionId, {
        responseType: 'ACCEPT',
        responseMessage: "I'd be happy to help you learn this skill!"
      });
      showSuccess('Session accepted! Student has been notified.');
      fetchData();
    } catch (error) {
      alert('Failed to accept session: ' + handleApiError(error));
    }
  };

  const handleDeclineSession = async (sessionId) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    try {
      await sessionsAPI.respondToSession(sessionId, {
        responseType: 'DECLINE',
        responseMessage: reason || "I'm not available for this session at the moment."
      });
      showSuccess('Session declined. Student has been notified.');
      fetchData();
    } catch (error) {
      alert('Failed to decline session: ' + handleApiError(error));
    }
  };

  const handleScheduleSession = async (sessionId, scheduleData) => {
    try {
      await sessionsAPI.scheduleSession(sessionId, scheduleData);
      showSuccess('Session scheduled successfully!');
      setScheduleModal({ open: false, session: null });
      fetchData();
    } catch (error) {
      alert('Failed to schedule session: ' + handleApiError(error));
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await sessionsAPI.completeSession(sessionId);
      showSuccess('Session marked as completed! You can now rate each other.');
      fetchData();
    } catch (error) {
      alert('Failed to complete session: ' + handleApiError(error));
    }
  };

  const handleRateSession = async (sessionId, ratingData) => {
    try {
      await sessionsAPI.rateSession(sessionId, ratingData);
      showSuccess('Thank you for rating the session!');
      setRatingModal({ open: false, session: null });
      fetchData();
    } catch (error) {
      alert('Failed to rate session: ' + handleApiError(error));
    }
  };

  const handleMessageUser = async (session) => {
  try {
    console.log('Starting handleMessageUser with session:', session);
    
    // Get current user info from localStorage (avoiding the auth endpoint issue)
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to be logged in to send messages.');
      return;
    }

    // Try to get current user from localStorage first
    let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let currentUserId = currentUser.id;

    // If not in localStorage, try to get from auth endpoint
    if (!currentUserId) {
      console.log('No user in localStorage, trying auth endpoint...');
      try {
        const userResponse = await fetch('http://localhost:8081/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          currentUser = await userResponse.json();
          currentUserId = currentUser.id;
          // Store for future use
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
          console.error('Auth endpoint failed, will try to extract from session data');
        }
      } catch (error) {
        console.error('Auth endpoint error:', error);
      }
    }

    // If still no current user ID, try to determine from session data
    if (!currentUserId) {
      console.log('Trying to determine current user from session context...');
      // This is a fallback - we'll assume the user viewing is one of the participants
      // You may need to get this from your auth context or another reliable source
      alert('Unable to determine current user. Please refresh the page and try again.');
      return;
    }

    console.log('Current user ID:', currentUserId);
    console.log('Session student ID:', session.studentId);
    console.log('Session teacher ID:', session.teacherId);

    // Determine the other participant
    let otherParticipantId, otherParticipantName;

    if (session.studentId && session.studentId === currentUserId) {
      // Current user is student, message the teacher
      otherParticipantId = session.teacherId;
      otherParticipantName = session.teacher?.firstName && session.teacher?.lastName 
        ? `${session.teacher.firstName} ${session.teacher.lastName}`
        : session.teacher?.displayName || session.otherParticipantName || 'Teacher';
      console.log('Current user is STUDENT, messaging teacher:', otherParticipantName);
    } else if (session.teacherId && session.teacherId === currentUserId) {
      // Current user is teacher, message the student  
      otherParticipantId = session.studentId;
      otherParticipantName = session.student?.firstName && session.student?.lastName
        ? `${session.student.firstName} ${session.student.lastName}`
        : session.student?.displayName || session.otherParticipantName || 'Student';
      console.log('Current user is TEACHER, messaging student:', otherParticipantName);
    } else {
      console.error('Cannot determine user role in session');
      console.log('Available session data:', {
        studentId: session.studentId,
        teacherId: session.teacherId,
        currentUserId: currentUserId,
        otherParticipantName: session.otherParticipantName
      });
      alert('Unable to determine your role in this session.');
      return;
    }

    if (!otherParticipantId) {
      console.error('Other participant ID is missing');
      alert('Unable to get the other participant information.');
      return;
    }

    console.log('Target user:', { otherParticipantId, otherParticipantName });

    // Check for existing conversation
    console.log('Checking for existing conversations...');
    try {
      const conversationsResponse = await fetch('http://localhost:8081/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationsResponse.ok) {
        const conversations = await conversationsResponse.json();
        console.log('Found', conversations.length, 'conversations');
        
        const existingConversation = conversations.find(conv => 
          conv.otherParticipant && conv.otherParticipant.id === otherParticipantId
        );

        if (existingConversation) {
          console.log('Found existing conversation:', existingConversation.id);
          console.log('Navigating to existing conversation...');
          
          navigate('/messages', { 
            state: { 
              activeConversationId: existingConversation.id,
              otherParticipantName: otherParticipantName 
            } 
          });
          return;
        } else {
          console.log('No existing conversation found');
        }
      } else {
        console.log('Failed to fetch conversations, will create new one');
      }
    } catch (error) {
      console.log('Error checking conversations:', error);
    }

    // If no existing conversation, navigate to messages page and trigger new message modal
    console.log('Navigating to new message...');
    navigate('/messages', { 
      state: { 
        startNewMessageWith: {
          id: otherParticipantId,
          name: otherParticipantName,
          sessionContext: `Hi! I wanted to follow up about our "${session.title}" session.`
        }
      } 
    });

    console.log('Navigation completed successfully');

  } catch (error) {
    console.error('Error in handleMessageUser:', error);
    alert('Failed to open messages. Please try again. Error: ' + error.message);
  }
};

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && session.status === 'PENDING' && session.needsAction) ||
      (filter === 'upcoming' && session.status === 'SCHEDULED') ||
      (filter === 'completed' && session.status === 'COMPLETED') ||
      (filter === 'to-rate' && session.canRate);
    
    const matchesSearch = !searchTerm || 
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.skill?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="beautiful-sessions-container">
        <div className="container-inner">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="beautiful-sessions-container">
      <div className="container-inner">
        {/* Success Message */}
        {successMessage && (
          <div className="success-notification">
            <CheckCircle className="success-icon" size={20} />
            <p className="success-text">{successMessage}</p>
          </div>
        )}

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Sessions</h1>
          <p className="dashboard-subtitle">
            Manage your learning and teaching sessions with ease
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon-wrapper" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <TrendingUp size={28} />
              </div>
              <div className="stats-details">
                <p className="stats-label">Total Sessions</p>
                <p className="stats-value">{stats.totalSessions || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Clock3 size={28} />
              </div>
              <div className="stats-details">
                <p className="stats-label">Pending</p>
                <p className="stats-value">{stats.pendingSessions || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <Calendar1 size={28} />
              </div>
              <div className="stats-details">
                <p className="stats-label">Upcoming</p>
                <p className="stats-value">{stats.upcomingSessions || 0}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon-wrapper" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <Award size={28} />
              </div>
              <div className="stats-details">
                <p className="stats-label">Avg Rating</p>
                <p className="stats-value">
                  {stats.averageRatingReceived ? stats.averageRatingReceived.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="dashboard-controls">
          <div className="controls-header">
            <h3 className="controls-title">Filter & Search</h3>
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search sessions, skills, or people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All Sessions', count: sessions.length },
              { key: 'pending', label: 'Need Response', count: sessions.filter(s => s.needsAction).length },
              { key: 'upcoming', label: 'Upcoming', count: sessions.filter(s => s.status === 'SCHEDULED').length },
              { key: 'completed', label: 'Completed', count: sessions.filter(s => s.status === 'COMPLETED').length },
              { key: 'to-rate', label: 'To Rate', count: sessions.filter(s => s.canRate).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              >
                {tab.label}
                {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="sessions-list">
          {filteredSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3 className="empty-title">No sessions found</h3>
              <p className="empty-description">
                {filter === 'all' 
                  ? "You don't have any sessions yet. Start by exploring skills and booking your first session!"
                  : `No ${filter} sessions found. Try adjusting your filters or search terms.`
                }
              </p>
              {filter === 'all' && (
                <button 
                  className="action-btn btn-primary" 
                  onClick={() => window.location.href = '/explore'}
                >
                  <BookOpen className="btn-icon" size={18} />
                  Explore Skills
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map(session => (
              <div key={session.id} className="session-card">
                {/* Header */}
                <div className="session-header">
                  <div className="session-title-row">
                    <h3 className="session-title">{session.title}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`status-badge status-${session.status.toLowerCase()}`}>
                        {session.status === 'PENDING' && <Clock className="btn-icon" size={16} />}
                        {session.status === 'ACCEPTED' && <CheckCircle className="btn-icon" size={16} />}
                        {session.status === 'SCHEDULED' && <Calendar className="btn-icon" size={16} />}
                        {session.status === 'COMPLETED' && <CheckCircle className="btn-icon" size={16} />}
                        {(session.status === 'CANCELLED' || session.status === 'DECLINED') && <XCircle className="btn-icon" size={16} />}
                        {session.status}
                      </span>
                      {session.needsAction && (
                        <span className="action-required">
                          <AlertCircle size={16} />
                          Action Required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="session-meta">
                    <div className="meta-item">
                      <User className="meta-icon" size={18} />
                      {session.otherParticipantName}
                    </div>
                    <div className="meta-item">
                      <BookOpen className="meta-icon" size={18} />
                      {session.skill?.name}
                    </div>
                    <div className="meta-item">
                      <Clock className="meta-icon" size={18} />
                      {session.durationMinutes} min
                    </div>
                  </div>
                  
                  {session.statusDisplayText && (
                    <p className="session-description">{session.statusDisplayText}</p>
                  )}
                </div>

                {/* Student Message */}
                {session.studentMessage && (
                  <div className="student-message">
                    <p className="message-label">Student Message:</p>
                    <p className="message-text">"{session.studentMessage}"</p>
                  </div>
                )}

                {/* Meeting Info */}
                {session.scheduledAt && (
                  <div className="meeting-info">
                    <div className="meeting-details">
                      <div className="meeting-item">
                        <Calendar className="meeting-icon" size={20} />
                        <strong>Scheduled: {formatDateTime(session.scheduledAt)}</strong>
                      </div>
                      {session.meetingLink && (
                        <div className="meeting-item">
                          <Video className="meeting-icon" size={20} />
                          <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            Join Meeting
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="session-actions">
                  {session.status === 'PENDING' && session.needsAction && (
                    <>
                      <button
                        onClick={() => handleAcceptSession(session.id)}
                        className="action-btn btn-success"
                      >
                        <CheckCircle className="btn-icon" size={18} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineSession(session.id)}
                        className="action-btn btn-danger"
                      >
                        <XCircle className="btn-icon" size={18} />
                        Decline
                      </button>
                    </>
                  )}

                  {session.canSchedule && (
                    <button
                      onClick={() => setScheduleModal({ open: true, session })}
                      className="action-btn btn-primary"
                    >
                      <Calendar className="btn-icon" size={18} />
                      Schedule
                    </button>
                  )}

                  {session.canComplete && (
                    <button
                      onClick={() => handleCompleteSession(session.id)}
                      className="action-btn btn-success"
                    >
                      <CheckCircle className="btn-icon" size={18} />
                      Mark Complete
                    </button>
                  )}

                  {session.canRate && (
                    <button
                      onClick={() => setRatingModal({ open: true, session })}
                      className="action-btn btn-warning"
                    >
                      <Star className="btn-icon" size={18} />
                      Rate Session
                    </button>
                  )}

                  <button 
                    className="action-btn btn-ghost"
                    onClick={() => handleMessageUser(session)}
                    title={`Message ${session.otherParticipantName}`}
                  >
                    <MessageCircle className="btn-icon" size={18} />
                    Message
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleModal.open && (
        <ScheduleModal
          session={scheduleModal.session}
          onClose={() => setScheduleModal({ open: false, session: null })}
          onSchedule={(scheduleData) => handleScheduleSession(scheduleModal.session.id, scheduleData)}
        />
      )}

      {/* Rating Modal */}
      {ratingModal.open && (
        <RatingModal
          session={ratingModal.session}
          onClose={() => setRatingModal({ open: false, session: null })}
          onRate={(ratingData) => handleRateSession(ratingModal.session.id, ratingData)}
        />
      )}
    </div>
  );
};

// Enhanced Schedule Modal Component
const ScheduleModal = ({ session, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    meetingLink: '',
    meetingLocation: '',
    meetingNotes: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Date cannot be in the past';
      }
    }
    
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Please select a time';
    } else if (formData.scheduledDate) {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const oneHourFromNow = new Date(Date.now() + 3600000);
      if (scheduledDateTime < oneHourFromNow) {
        newErrors.scheduledTime = 'Time must be at least 1 hour from now';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const scheduleData = {
      scheduledAt: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString(),
      meetingLink: formData.meetingLink,
      meetingLocation: formData.meetingLocation,
      meetingNotes: formData.meetingNotes
    };
    
    onSchedule(scheduleData);
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMinTime = () => {
    const now = new Date();
    const isToday = formData.scheduledDate === now.toISOString().split('T')[0];
    if (isToday) {
      const oneHourLater = new Date(now.getTime() + 3600000);
      return oneHourLater.toTimeString().slice(0, 5);
    }
    return '';
  };

  const setQuickTime = (hour, minute = 0) => {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, scheduledTime: time }));
    setErrors(prev => ({ ...prev, scheduledTime: '' }));
  };

  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Schedule Session</h2>
          <p className="modal-subtitle">
            Set up meeting details with {session?.otherParticipantName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Date and Time Section */}
          <div className="form-group">
            <label className="form-label form-label-required">When</label>
            <span className="form-helper">
              Select your preferred date and time (MM/DD/YYYY and HH:MM format)
            </span>
            
            <div className="datetime-container">
              <div>
                <label className="form-label" htmlFor="date-input">Date</label>
                <input
                  id="date-input"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, scheduledDate: e.target.value }));
                    setErrors(prev => ({ ...prev, scheduledDate: '' }));
                  }}
                  min={getMinDate()}
                  required
                  className="form-input"
                  aria-describedby={errors.scheduledDate ? 'date-error' : undefined}
                />
                {errors.scheduledDate && (
                  <div id="date-error" className="form-error">
                    <AlertCircle className="error-icon" size={16} />
                    {errors.scheduledDate}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="time-input">Time</label>
                <input
                  id="time-input"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, scheduledTime: e.target.value }));
                    setErrors(prev => ({ ...prev, scheduledTime: '' }));
                  }}
                  min={getMinTime()}
                  required
                  className="form-input"
                  aria-describedby={errors.scheduledTime ? 'time-error' : undefined}
                />
                {errors.scheduledTime && (
                  <div id="time-error" className="form-error">
                    <AlertCircle className="error-icon" size={16} />
                    {errors.scheduledTime}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Time Selection */}
            <div className="quick-time-buttons">
              <button type="button" className="quick-time-btn" onClick={() => setQuickTime(9)}>
                9:00 AM
              </button>
              <button type="button" className="quick-time-btn" onClick={() => setQuickTime(12)}>
                12:00 PM
              </button>
              <button type="button" className="quick-time-btn" onClick={() => setQuickTime(14)}>
                2:00 PM
              </button>
              <button type="button" className="quick-time-btn" onClick={() => setQuickTime(17)}>
                5:00 PM
              </button>
              <button type="button" className="quick-time-btn" onClick={() => setQuickTime(19)}>
                7:00 PM
              </button>
            </div>

            <div className="timezone-display">
              <Clock className="meta-icon" size={14} />
              Your timezone: {getUserTimezone()}
            </div>
          </div>

          {/* Meeting Link */}
          <div className="form-group">
            <label className="form-label" htmlFor="meeting-link">Video Meeting Link</label>
            <span className="form-helper">
              Optional - Add a Google Meet, Zoom, or other video call link
            </span>
            <input
              id="meeting-link"
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="form-input"
            />
          </div>

          {/* Physical Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="meeting-location">Physical Location</label>
            <span className="form-helper">
              Optional - For in-person meetings, specify the location
            </span>
            <input
              id="meeting-location"
              type="text"
              value={formData.meetingLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingLocation: e.target.value }))}
              placeholder="Coffee shop, library, campus building, etc."
              className="form-input"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="meeting-notes">Session Notes</label>
            <span className="form-helper">
              Optional - Add agenda items, preparation notes, or special instructions
            </span>
            <textarea
              id="meeting-notes"
              value={formData.meetingNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingNotes: e.target.value }))}
              placeholder="What should we focus on? Any materials to bring? Preparation needed?"
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="action-btn btn-ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="action-btn btn-primary"
              style={{ flex: 1 }}
            >
              <Calendar className="btn-icon" size={18} />
              Schedule Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Rating Modal Component
const RatingModal = ({ session, onClose, onRate }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating before submitting');
      return;
    }
    onRate({ rating, feedback });
  };

  const getRatingText = (stars) => {
    const texts = {
      1: "Poor - Session didn't meet expectations",
      2: "Fair - Some issues but had value", 
      3: "Good - Solid session overall",
      4: "Very Good - Exceeded expectations",
      5: "Excellent - Outstanding experience!"
    };
    return texts[stars] || "Select a rating";
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Rate Your Session</h2>
          <p className="modal-subtitle">
            How was your session with {session?.otherParticipantName}?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label form-label-required">Your Rating</label>
            <span className="form-helper">
              Rate your overall experience (1 = Poor, 5 = Excellent)
            </span>
            
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${star <= (hoveredRating || rating) ? 'star-filled' : 'star-empty'}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  style={{ backgroundColor: 'white' }}
                >
                  ★
                </button>
              ))}
            </div>
            
            <div className="rating-text">
              {getRatingText(hoveredRating || rating)}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="feedback-input">Feedback</label>
            <span className="form-helper">
              Optional - Share details about your experience to help improve future sessions
            </span>
            <textarea
              id="feedback-input"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What went well? What could be improved? Any specific highlights?"
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="action-btn btn-ghost"
              style={{ flex: 1 }}
            >
              Skip Rating
            </button>
            <button 
              type="submit" 
              className="action-btn btn-warning"
              style={{ flex: 1 }}
            >
              <Star className="btn-icon" size={18} />
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionsDashboard;
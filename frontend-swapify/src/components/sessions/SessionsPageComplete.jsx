// src/components/sessions/SessionsPageComplete.jsx
import React, { useState, useEffect } from 'react';
import { sessionsAPI, handleApiError } from '../../services/apiService';
import SessionsDashboard from './SessionsDashboard';

const SessionsPageComplete = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  const fetchSessions = async () => {
    try {
      const result = await sessionsAPI.getUserSessions();
      setSessions(result.content || result);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // For demo, use mock data if API fails
      setTimeout(() => {
        setSessions([
          {
            id: 1,
            title: "Learn JavaScript Basics",
            skill: { name: "JavaScript", category: "Programming" },
            teacher: { id: 2, firstName: "John", lastName: "Doe", profileImageUrl: null },
            student: { id: 1, firstName: "Jane", lastName: "Smith", profileImageUrl: null },
            status: "PENDING",
            durationMinutes: 60,
            studentMessage: "I'm a complete beginner and would like to learn the basics of JavaScript",
            createdAt: new Date().toISOString(),
            canCancel: true,
            canSchedule: false,
            needsAction: false,
            otherParticipantName: "John Doe",
            statusDisplayText: "Waiting for teacher response"
          },
          {
            id: 2,
            title: "Python Data Structures",
            skill: { name: "Python", category: "Programming" },
            teacher: { id: 1, firstName: "Jane", lastName: "Smith", profileImageUrl: null },
            student: { id: 3, firstName: "Mike", lastName: "Johnson", profileImageUrl: null },
            status: "ACCEPTED",
            durationMinutes: 90,
            scheduledAt: null,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            canCancel: true,
            canSchedule: true,
            needsAction: true,
            otherParticipantName: "Mike Johnson",
            statusDisplayText: "Accepted - needs scheduling"
          },
          {
            id: 3,
            title: "React Components",
            skill: { name: "React", category: "Programming" },
            teacher: { id: 1, firstName: "Jane", lastName: "Smith", profileImageUrl: null },
            student: { id: 4, firstName: "Sarah", lastName: "Wilson", profileImageUrl: null },
            status: "SCHEDULED",
            durationMinutes: 120,
            scheduledAt: new Date(Date.now() + 172800000).toISOString(),
            meetingLink: "https://meet.google.com/xyz",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            canCancel: true,
            canComplete: true,
            needsAction: false,
            otherParticipantName: "Sarah Wilson",
            statusDisplayText: "Scheduled for tomorrow"
          }
        ]);
      }, 1000);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await sessionsAPI.getSessionStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Mock stats for demo
      setStats({
        totalSessions: 12,
        pendingSessions: 2,
        upcomingSessions: 1,
        completedSessions: 9,
        sessionsAsStudent: 8,
        sessionsAsTeacher: 4,
        averageRating: 4.5
      });
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const refreshSessions = () => {
    fetchSessions();
    fetchStats();
  };

  // Session Response Handlers
  const handleAcceptSession = async (sessionId) => {
    const responseData = {
      sessionId: sessionId,
      responseType: 'ACCEPT',
      responseMessage: 'I\'d be happy to teach you this skill!'
    };

    try {
      await sessionsAPI.respondToSession(sessionId, responseData);
      showSuccessMessage('Session accepted successfully!');
      refreshSessions();
    } catch (error) {
      console.error('Failed to accept session:', error);
      alert('Failed to accept session: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeclineSession = async (sessionId) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    const responseData = {
      sessionId: sessionId,
      responseType: 'DECLINE',
      responseMessage: reason || 'I\'m not available for this session at the moment.'
    };

    try {
      await sessionsAPI.respondToSession(sessionId, responseData);
      showSuccessMessage('Session declined.');
      refreshSessions();
    } catch (error) {
      console.error('Failed to decline session:', error);
      alert('Failed to decline session: ' + (error.message || 'Unknown error'));
    }
  };

  // Session Scheduling Handler
  const handleScheduleSession = async (sessionId) => {
    // Simple scheduling - in a real app, you'd open a scheduling modal
    const dateTime = prompt('Enter date and time (YYYY-MM-DD HH:MM):');
    if (!dateTime) return;

    const scheduleData = {
      sessionId: sessionId,
      scheduledAt: new Date(dateTime).toISOString(),
      meetingLink: 'https://meet.google.com/generated-link',
      meetingNotes: 'Looking forward to our session!'
    };

    try {
      await sessionsAPI.scheduleSession(sessionId, scheduleData);
      showSuccessMessage('Session scheduled successfully!');
      refreshSessions();
    } catch (error) {
      console.error('Failed to schedule session:', error);
      alert('Failed to schedule session: ' + (error.message || 'Unknown error'));
    }
  };

  // Session Rating Handler
  const handleRateSession = async (sessionId) => {
    const rating = prompt('Rate this session (1-5 stars):');
    const feedback = prompt('Any feedback? (optional):');
    
    if (!rating || rating < 1 || rating > 5) return;

    const ratingData = {
      sessionId: sessionId,
      rating: parseInt(rating),
      feedback: feedback || ''
    };

    try {
      await sessionsAPI.rateSession(sessionId, ratingData);
      showSuccessMessage('Thank you for rating the session!');
      refreshSessions();
    } catch (error) {
      console.error('Failed to rate session:', error);
      alert('Failed to rate session: ' + (error.message || 'Unknown error'));
    }
  };

  // Action Handlers for Dashboard
  const actionHandlers = {
    handleAcceptSession: handleAcceptSession,
    handleDeclineSession: handleDeclineSession,
    handleScheduleSession: handleScheduleSession,
    handleCompleteSession: async (sessionId) => {
      try {
        await sessionsAPI.completeSession(sessionId);
        showSuccessMessage('Session marked as completed!');
        refreshSessions();
      } catch (error) {
        console.error('Failed to complete session:', error);
        alert('Failed to complete session: ' + (error.message || 'Unknown error'));
      }
    },
    handleCancelSession: async (sessionId) => {
      const reason = prompt('Please provide a reason for cancellation:');
      if (reason) {
        try {
          await sessionsAPI.cancelSession(sessionId, { cancellationReason: reason });
          showSuccessMessage('Session cancelled successfully.');
          refreshSessions();
        } catch (error) {
          console.error('Failed to cancel session:', error);
          alert('Failed to cancel session: ' + (error.message || 'Unknown error'));
        }
      }
    },
    handleRateSession: handleRateSession
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          padding: '1rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: '1.25rem',
                height: '1.25rem',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>✓</span>
              </div>
            </div>
            <div style={{ marginLeft: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#15803d', margin: 0 }}>
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <SessionsDashboard 
        sessions={sessions}
        stats={stats}
        loading={loading}
        actionHandlers={actionHandlers}
      />
    </div>
  );
};

export default SessionsPageComplete;
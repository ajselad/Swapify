// components/profile/ProfileCompletion.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProfileCompletion = () => {
  const [completionData, setCompletionData] = useState({
    completionPercentage: 0,
    isComplete: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletionStatus();
  }, []);

  const fetchCompletionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/profile/completion-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompletionData(data);
      }
    } catch (error) {
      console.error('Failed to fetch completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  const { completionPercentage, isComplete } = completionData;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
      border: '2px dashed #3b82f6',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          Profile Completion
        </h3>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          backgroundColor: isComplete ? '#d1fae5' : '#fed7d7',
          color: isComplete ? '#065f46' : '#c53030'
        }}>
          {completionPercentage}%
        </span>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
            width: `${completionPercentage}%`
          }} />
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        {isComplete ? (
          <p style={{ color: '#065f46', margin: 0, fontSize: '0.95rem' }}>
            ✅ Your profile is complete! You're ready to start skill swapping.
          </p>
        ) : (
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
            Complete your profile to get better matches and build trust with other users.
          </p>
        )}
      </div>
      
      <Link 
        to="/profile/settings" 
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          textDecoration: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {isComplete ? 'Edit Profile' : 'Complete Profile'}
      </Link>
    </div>
  );
};

export default ProfileCompletion;
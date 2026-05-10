import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/apiService';
import '../../assets/styles/AdminUserDetails.css';

export default function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [userGoals, setUserGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Force reload user data
  const loadUserDetails = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading user details for ID:', userId);
      
      // Get user details with timestamp to prevent caching
      const userResponse = await adminAPI.getUserDetails(userId);
      console.log('📥 Received user data:', userResponse);
      setUser(userResponse);

      // Get user skills and goals
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        const skillsResponse = await fetch(`http://localhost:8081/api/skills/user/${userId}/skills?t=${Date.now()}`, {
          headers
        });
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData || []);
        }
      } catch (err) {
        console.warn('Could not load user skills:', err);
        setUserSkills([]);
      }

      try {
        const goalsResponse = await fetch(`http://localhost:8081/api/skills/user/${userId}/goals?t=${Date.now()}`, {
          headers
        });
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setUserGoals(goalsData || []);
        }
      } catch (err) {
        console.warn('Could not load user goals:', err);
        setUserGoals([]);
      }

    } catch (err) {
      console.error('Error loading user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserDetails(true);
    }
  }, [userId]);

  const handlePromote = async () => {
    if (!window.confirm('Are you sure you want to promote this user to admin?')) return;
    
    try {
      console.log('🔧 Promoting user:', userId);
      await adminAPI.promoteUser(userId);
      alert('User promoted to admin successfully');
      
      // Force immediate reload
      console.log('🔄 Reloading user data after promotion...');
      await loadUserDetails(false);
      
    } catch (err) {
      console.error('Promotion error:', err);
      const errorMsg = err.message || 'Failed to promote user';
      alert('Error: ' + errorMsg);
    }
  };

  const handleDemote = async () => {
    if (!window.confirm('Are you sure you want to remove admin privileges from this user?')) return;
    
    try {
      console.log('🔧 Demoting user:', userId);
      await adminAPI.demoteUser(userId);
      alert('Admin privileges removed successfully');
      
      // Force immediate reload
      console.log('🔄 Reloading user data after demotion...');
      await loadUserDetails(false);
      
    } catch (err) {
      console.error('Demotion error:', err);
      const errorMsg = err.message || 'Failed to remove admin privileges';
      alert('Error: ' + errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete user: ${user.email}?\n\nThis action cannot be undone!`)) return;
    
    try {
      console.log('🗑️ Deleting user:', userId);
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully');
      navigate('/admin/users');
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err.message || 'Failed to delete user';
      alert('Error: ' + errorMsg);
    }
  };

  const handleToggleStatus = async () => {
    const action = user.enabled ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} user: ${user.email}?`)) return;
    
    try {
      console.log(`🔧 ${action}ing user:`, userId);
      const response = await adminAPI.toggleUserStatus(userId);
      const message = response.message || `User ${action}d successfully`;
      alert(message);
      
      // Force immediate reload
      console.log('🔄 Reloading user data after status toggle...');
      await loadUserDetails(false);
      
    } catch (err) {
      console.error('Status toggle error:', err);
      const errorMsg = err.message || `Failed to ${action} user`;
      alert('Error: ' + errorMsg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSkillLevel = (level) => {
    switch (level) {
      case 'BEGINNER': return 'Beginner';
      case 'INTERMEDIATE': return 'Intermediate';
      case 'ADVANCED': return 'Advanced';
      case 'EXPERT': return 'Expert';
      default: return level || '';
    }
  };

  const formatPriority = (priority) => {
    switch (priority) {
      case 'HIGH': return 'High Priority';
      case 'MEDIUM': return 'Medium Priority';
      case 'LOW': return 'Low Priority';
      default: return priority || '';
    }
  };

  if (loading) {
    return (
      <div className="admin-user-details">
        <div className="loading-container">Loading user details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-user-details">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/admin/users')} className="back-button">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-user-details">
        <div className="error-container">
          <h3>User Not Found</h3>
          <p>The requested user could not be found.</p>
          <button onClick={() => navigate('/admin/users')} className="back-button">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-details">
      <div className="header-section">
        <div className="header-content">
          <Link to="/admin/users" className="back-link">
            ← Back to Users
          </Link>
          <h1>User Details</h1>
          <p>Detailed information for user ID: {userId}</p>
          
          {/* Debug info - remove this later */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Last updated: {new Date().toLocaleTimeString()} | 
            Role: {user.role} | 
            Status: {user.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      <div className="user-details-content">
        {/* Basic Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Basic Information</h2>
            <div className="user-actions">
              {user.role === 'ADMIN' ? (
                <button onClick={handleDemote} className="action-button demote-button">
                  Remove Admin
                </button>
              ) : (
                <button onClick={handlePromote} className="action-button promote-button">
                  Make Admin
                </button>
              )}
              
              <button 
                onClick={handleToggleStatus}
                className={`action-button ${user.enabled ? 'disable-button' : 'enable-button'}`}
              >
                {user.enabled ? 'Disable User' : 'Enable User'}
              </button>
              
              <button onClick={handleDelete} className="action-button delete-button">
                Delete User
              </button>
              
              <button onClick={handleDelete} className="action-button delete-button">
                Delete User
              </button>
              
              {/* Temporary debug button - remove later */}
              <button 
                onClick={() => loadUserDetails(false)} 
                className="action-button"
                style={{ backgroundColor: '#8b5cf6', color: 'white' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <label>User ID:</label>
                <span>{user.id}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>First Name:</label>
                <span>{user.firstName || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Last Name:</label>
                <span>{user.lastName || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Role:</label>
                <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                  {user.role || 'USER'}
                </span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${user.enabled ? 'status-active' : 'status-disabled'}`}>
                  {user.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="info-item">
                <label>Email Verified:</label>
                <span className={`verification-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                  {user.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="info-item">
                <label>Registration Date:</label>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Last Updated:</label>
                <span>{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Profile Information</h2>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Bio:</label>
                <span>{user.bio || 'No bio provided'}</span>
              </div>
              <div className="info-item">
                <label>Location:</label>
                <span>{user.location || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{user.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Date of Birth:</label>
                <span>{user.dateOfBirth || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Experience Level:</label>
                <span>{user.experienceLevel || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Hourly Rate:</label>
                <span>{user.hourlyRate ? `$${user.hourlyRate}` : 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Availability:</label>
                <span>{user.availability || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="availability-status">
              <div className="status-item">
                <label>Looking to Learn:</label>
                <span className={`status-badge ${user.isLookingToLearn ? 'status-active' : 'status-inactive'}`}>
                  {user.isLookingToLearn ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="status-item">
                <label>Available for Teaching:</label>
                <span className={`status-badge ${user.isAvailableForTeaching ? 'status-active' : 'status-inactive'}`}>
                  {user.isAvailableForTeaching ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Skills & Interests</h2>
          </div>
          <div className="card-content">
            <div className="skills-section">
              <h3>Skills User Can Teach</h3>
              {userSkills.length > 0 ? (
                <div className="skills-grid">
                  {userSkills.map((userSkill, index) => (
                    <div key={userSkill.id || index} className="skill-tag">
                      <span className="skill-name">{userSkill.skill?.name || userSkill.name}</span>
                      <span className={`skill-level ${userSkill.level?.toLowerCase()}`}>
                        {formatSkillLevel(userSkill.level)}
                      </span>
                      <span className="skill-category">{userSkill.skill?.category}</span>
                    </div>
                  ))}
                </div>
              ) : user.skills ? (
                <div className="legacy-skills">
                  <p><strong>Legacy Skills:</strong> {user.skills}</p>
                </div>
              ) : (
                <p className="no-data">No skills listed</p>
              )}
            </div>

            <div className="skills-section">
              <h3>Learning Goals</h3>
              {userGoals.length > 0 ? (
                <div className="skills-grid">
                  {userGoals.map((userGoal, index) => (
                    <div key={userGoal.id || index} className="goal-tag">
                      <span className="goal-name">{userGoal.skill?.name || userGoal.name}</span>
                      <span className={`goal-priority ${userGoal.priority?.toLowerCase()}`}>
                        {formatPriority(userGoal.priority)}
                      </span>
                      <span className="goal-category">{userGoal.skill?.category}</span>
                    </div>
                  ))}
                </div>
              ) : user.interests ? (
                <div className="legacy-interests">
                  <p><strong>Legacy Interests:</strong> {user.interests}</p>
                </div>
              ) : (
                <p className="no-data">No learning goals listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Links Card - Always Show */}
        <div className="details-card">
          <div className="card-header">
            <h2>Social Links</h2>
          </div>
          <div className="card-content">
            {(user.website || user.linkedinUrl || user.githubUrl) ? (
              <div className="social-links">
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="social-link">
                    🌐 Website
                  </a>
                )}
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                    💼 LinkedIn
                  </a>
                )}
                {user.githubUrl && (
                  <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                    🐙 GitHub
                  </a>
                )}
              </div>
            ) : (
              <p className="no-data">No social links provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
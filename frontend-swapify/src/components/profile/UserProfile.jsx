// components/profile/UserProfile.jsx - Complete version
import React, { useState, useEffect } from 'react';
import '../../assets/styles/userprofile.css';

const UserProfile = ({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching profile data for userId: ${userId}`);

      // Fetch user profile, skills, and learning goals in parallel
      const [profileRes, skillsRes, goalsRes] = await Promise.all([
        fetch(`http://localhost:8081/api/profile/user/${userId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`http://localhost:8081/api/skills/user/${userId}/skills`, {
          headers: getAuthHeaders()
        }),
        fetch(`http://localhost:8081/api/skills/user/${userId}/goals`, {
          headers: getAuthHeaders()
        })
      ]);

      // Handle profile response
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('Profile data received:', profileData);
        setProfile(profileData);
      } else {
        const errorText = await profileRes.text();
        console.error('Profile fetch failed:', profileRes.status, errorText);
        throw new Error('Failed to fetch profile');
      }

      // Handle skills response
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        console.log('Skills data received:', skillsData);
        setSkills(skillsData || []);
      } else {
        console.warn('Skills fetch failed, setting empty array');
        setSkills([]);
      }

      // Handle goals response
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        console.log('Goals data received:', goalsData);
        setLearningGoals(goalsData || []);
      } else {
        console.warn('Goals fetch failed, setting empty array');
        setLearningGoals([]);
      }

    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.displayName || profile?.name || 'User';
  };

  const getSkillsArray = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  };

  const formatExperienceLevel = (level) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const formatPriority = (priority) => {
    switch (priority) {
      case 'HIGH': return 'High Priority';
      case 'MEDIUM': return 'Medium Priority'; 
      case 'LOW': return 'Low Priority';
      default: return priority || '';
    }
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

  const handleContactUser = () => {
    // You can implement messaging/contact functionality here
    console.log('Contact user:', userId);
    // For now, we'll show an alert, but you can redirect to messaging
    alert('Messaging feature coming soon! This will redirect to send a message to this user.');
    // Future: navigate to messages with pre-filled recipient
    // navigate(`/messages?recipient=${userId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Profile</h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading profile...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchUserProfile} className="retry-button">
                Try Again
              </button>
            </div>
          ) : profile ? (
            <div className="profile-content">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-avatar">
                  {profile.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt={getDisplayName()}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="default-avatar" 
                    style={{ 
                      display: profile.profileImageUrl ? 'none' : 'flex' 
                    }}
                  >
                    <span>{getDisplayName().charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">{getDisplayName()}</h3>
                  {profile.location && (
                    <p className="profile-location">
                      <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      {profile.location}
                    </p>
                  )}
                  {profile.experienceLevel && (
                    <span className={`experience-badge ${profile.experienceLevel.toLowerCase()}`}>
                      {formatExperienceLevel(profile.experienceLevel)}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              

              {/* Bio */}
              {profile.bio && (
                <div className="profile-section">
                  <h4>About</h4>
                  <p className="profile-bio">{profile.bio}</p>
                </div>
              )}

              {/* Availability Status */}
              <div className="profile-section">
                <h4>Availability</h4>
                <div className="availability-badges">
                  <span className={`status-badge ${profile.isLookingToLearn ? 'active' : 'inactive'}`}>
                    {profile.isLookingToLearn ? 'Looking to Learn' : 'Not Looking to Learn'}
                  </span>
                  <span className={`status-badge ${profile.isAvailableForTeaching ? 'active' : 'inactive'}`}>
                    {profile.isAvailableForTeaching ? 'Available to Teach' : 'Not Available to Teach'}
                  </span>
                </div>
                {profile.availability && (
                  <p className="availability-time">
                    <strong>Preferred Time:</strong> {formatExperienceLevel(profile.availability)}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="profile-section">
                <h4>Skills I Can Teach</h4>
                {skills.length > 0 ? (
                  <div className="skills-grid">
                    {skills.map((userSkill, index) => (
                      <div key={userSkill.id || index} className="skill-tag">
                        <span className="skill-name">{userSkill.skill?.name || userSkill.name}</span>
                        <span className={`skill-level ${userSkill.level?.toLowerCase()}`}>
                          {formatSkillLevel(userSkill.level)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : profile.skills ? (
                  <div className="skills-grid">
                    {getSkillsArray(profile.skills).map((skill, index) => (
                      <div key={index} className="skill-tag">
                        <span className="skill-name">{skill}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No skills listed</p>
                )}
              </div>

              {/* Learning Goals */}
              <div className="profile-section">
                <h4>Skills I Want to Learn</h4>
                {learningGoals.length > 0 ? (
                  <div className="skills-grid">
                    {learningGoals.map((userGoal, index) => (
                      <div key={userGoal.id || index} className="goal-tag">
                        <span className="goal-name">{userGoal.skill?.name || userGoal.name}</span>
                        <span className={`goal-priority ${userGoal.priority?.toLowerCase()}`}>
                          {formatPriority(userGoal.priority)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : profile.interests ? (
                  <div className="skills-grid">
                    {getSkillsArray(profile.interests).map((interest, index) => (
                      <div key={index} className="goal-tag">
                        <span className="goal-name">{interest}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No learning goals listed</p>
                )}
              </div>

              {/* Social Links */}
              {(profile.website || profile.linkedinUrl || profile.githubUrl) && (
                <div className="profile-section">
                  <h4>Links</h4>
                  <div className="social-links">
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link"
                      >
                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                        Website
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a 
                        href={profile.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link linkedin"
                      >
                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a 
                        href={profile.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link github"
                      >
                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}

             
            </div>
          ) : (
            <div className="error-state">
              <p>Profile not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
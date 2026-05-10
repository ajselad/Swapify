import React, { useState } from 'react';
import '../../assets/styles/sessionbookingmodal.css';

const SessionBookingModal = ({ 
  isOpen, 
  onClose, 
  teacher, 
  skill, 
  onBookSession 
}) => {
  const [formData, setFormData] = useState({
    title: `Learn ${skill?.name || 'Skill'} with ${teacher?.displayName || teacher?.firstName || 'Teacher'}`,
    description: '',
    durationMinutes: 60,
    meetingType: 'VIDEO_CALL',
    studentMessage: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOptionalMessage, setShowOptionalMessage] = useState(false);

  if (!isOpen) return null;

  // Better validation with fallbacks
  const teacherData = teacher || {};
  const skillData = skill || {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.durationMinutes < 15 || formData.durationMinutes > 240) {
      newErrors.durationMinutes = 'Duration must be between 15 and 240 minutes';
    }
    
    if (formData.studentMessage.length > 500) {
      newErrors.studentMessage = 'Message cannot exceed 500 characters';
    }

    if (!teacherData.id && !teacherData.teacherId) {
      newErrors.teacher = 'Teacher information is missing';
    }

    if (!skillData.id && !skillData.skillId) {
      newErrors.skill = 'Skill information is missing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        teacherId: teacherData.id || teacherData.teacherId || teacherData.userId,
        skillId: skillData.id || skillData.skillId,
        durationMinutes: parseInt(formData.durationMinutes),
        meetingType: formData.meetingType,
        studentMessage: formData.studentMessage.trim()
      };
      
      if (!bookingData.teacherId) {
        throw new Error('Teacher ID is missing. Please try selecting the session again.');
      }
      
      if (!bookingData.skillId) {
        throw new Error('Skill ID is missing. Please try selecting the session again.');
      }
      
      await onBookSession(bookingData);
      
      setFormData({
        title: `Learn ${skillData.name || 'Skill'} with ${teacherData.displayName || teacherData.firstName || 'Teacher'}`,
        description: '',
        durationMinutes: 60,
        meetingType: 'VIDEO_CALL',
        studentMessage: ''
      });
      
    } catch (error) {
      console.error('Booking submission failed:', error);
      
      if (error.message.includes('missing') || error.message.includes('Teacher ID') || error.message.includes('Skill ID')) {
        alert('Session information is incomplete. Please try booking again or contact support.');
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const meetingTypeOptions = [
    { value: 'VIDEO_CALL', label: 'Video Call', icon: '📹' },
    { value: 'IN_PERSON', label: 'In Person', icon: '🏢' },
    { value: 'PHONE', label: 'Phone Call', icon: '📞' }
  ];

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const displayTeacherName = teacherData.displayName || teacherData.firstName || teacherData.name || 'Teacher';
  const displaySkillName = skillData.name || skillData.title || 'Skill';
  const teacherLocation = teacherData.location || 'Location not specified';
  const teacherRating = teacherData.rating || 4.5;
  const reviewCount = teacherData.reviewCount || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">Book a Session</h2>
            <p className="modal-subtitle">Request a learning session</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Teacher Profile Section */}
        <div className="teacher-profile-section">
          <div className="teacher-profile-card">
            <div className="teacher-avatar">
              {teacherData.profileImageUrl ? (
                <img
                  src={teacherData.profileImageUrl}
                  alt={displayTeacherName}
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="avatar-fallback">
                {displayTeacherName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="teacher-info">
              <h3 className="teacher-name">{displayTeacherName}</h3>
              <p className="teacher-location">{teacherLocation}</p>
              <div className="teacher-details">
                <div className="teacher-rating">
                  <span className="rating-star">⭐</span>
                  <span className="rating-value">{teacherRating}</span>
                  <span className="review-count">({reviewCount} reviews)</span>
                </div>
                <div className="skill-badge">
                  {displaySkillName}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {/* Error Messages */}
          {(errors.teacher || errors.skill) && (
            <div className="error-banner">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Missing Information:</strong>
                {errors.teacher && <div>• {errors.teacher}</div>}
                {errors.skill && <div>• {errors.skill}</div>}
                <div className="error-hint">
                  Please close this modal and try selecting the session again.
                </div>
              </div>
            </div>
          )}

          {/* Session Info Section */}
          <div className="form-section">
            <h4 className="section-title">Session Information</h4>
            
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">✏️</span>
                Session Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="What would you like to learn?"
                className={`form-input ${errors.title ? 'error' : ''}`}
              />
              {errors.title && (
                <span className="error-text">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📝</span>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe what you want to learn or any specific topics..."
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">⏱️</span>
                  Duration
                </label>
                <select
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.durationMinutes && (
                  <span className="error-text">{errors.durationMinutes}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📹</span>
                  Meeting Type
                </label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {meetingTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optional Message Section */}
          <div className="form-section">
            <div className="optional-section-header">
              <button
                type="button"
                className="optional-toggle"
                onClick={() => setShowOptionalMessage(!showOptionalMessage)}
              >
                <span className="toggle-icon">
                  {showOptionalMessage ? '▼' : '▶'}
                </span>
                Add a note to teacher (optional)
              </button>
            </div>

            {showOptionalMessage && (
              <div className="form-group">
                <textarea
                  name="studentMessage"
                  value={formData.studentMessage}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell the teacher about your current level, what you hope to learn, any questions..."
                  className={`form-textarea ${errors.studentMessage ? 'error' : ''}`}
                />
                <div className="textarea-footer">
                  {errors.studentMessage && (
                    <span className="error-text">{errors.studentMessage}</span>
                  )}
                  <span className="char-count">
                    {formData.studentMessage.length}/500
                  </span>
                </div>
              </div>
            )}
          </div>

          

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || errors.teacher || errors.skill}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Sending Request...
                </>
              ) : (
                'Send Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionBookingModal;
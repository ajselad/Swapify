// src/components/sessions/ScheduleSessionModal.jsx
import React, { useState } from 'react';
import '../../assets/styles/modal.css';

const ScheduleSessionModal = ({ isOpen, onClose, session, onSchedule }) => {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    meetingLink: '',
    location: '',
    meetingNotes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'Date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduledAt);
      if (scheduledDate <= new Date()) {
        newErrors.scheduledAt = 'Scheduled time must be in the future';
      }
    }
    
    if (formData.meetingNotes && formData.meetingNotes.length > 2000) {
      newErrors.meetingNotes = 'Meeting notes cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const scheduleData = {
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString()
      };
      
      await onSchedule(scheduleData);
    } catch (error) {
      console.error('Scheduling failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    const now = new Date(date);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const minDateTime = formatDateTimeLocal(new Date(Date.now() + 3600000)); // 1 hour from now

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Schedule Session</h2>
            <p>Set up the meeting details for your session</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        {/* Session Info */}
        {session && (
          <div className="modal-info-section">
            <div className="session-info">
              <div className="session-avatar">
                {session.otherParticipantName?.charAt(0) || 'T'}
              </div>
              <div>
                <h3>{session.title}</h3>
                <p className="session-details">
                  <span>👤 {session.otherParticipantName}</span>
                  <span>📚 {session.skill.name}</span>
                  <span>⏰ {session.durationMinutes} min</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Date and Time */}
          <div className="form-group">
            <label className="form-label required">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleInputChange}
              min={minDateTime}
              className={`form-input ${errors.scheduledAt ? 'error' : ''}`}
            />
            {errors.scheduledAt && (
              <span className="error-text">{errors.scheduledAt}</span>
            )}
            <div className="form-hint">
              Choose a time that works for both you and your session partner
            </div>
          </div>

          {/* Meeting Link */}
          <div className="form-group">
            <label className="form-label">
              Meeting Link
            </label>
            <input
              type="url"
              name="meetingLink"
              value={formData.meetingLink}
              onChange={handleInputChange}
              placeholder="https://meet.google.com/... or https://zoom.us/..."
              className="form-input"
            />
            <div className="form-hint">
              Add a video call link (Google Meet, Zoom, etc.) or leave empty for phone/in-person
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Coffee shop, library, or any meeting place"
              className="form-input"
            />
            <div className="form-hint">
              For in-person meetings only
            </div>
          </div>

          {/* Meeting Notes */}
          <div className="form-group">
            <label className="form-label">
              Meeting Notes
            </label>
            <textarea
              name="meetingNotes"
              value={formData.meetingNotes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any additional information, preparation notes, or agenda items..."
              className={`form-textarea ${errors.meetingNotes ? 'error' : ''}`}
              maxLength={2000}
            />
            {errors.meetingNotes && (
              <span className="error-text">{errors.meetingNotes}</span>
            )}
            <div className="char-count">
              {formData.meetingNotes.length}/2000
            </div>
          </div>

          {/* Free Notice */}
          <div className="notice-card">
            <div className="notice-icon">✅</div>
            <div>
              <h4>Free Skill Swap Session</h4>
              <p>
                This is a free skill exchange. Both participants should come prepared to share their knowledge and learn from each other.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  📅 Schedule Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;
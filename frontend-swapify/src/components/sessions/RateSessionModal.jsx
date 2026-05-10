// src/components/sessions/RateSessionModal.jsx
import React, { useState } from 'react';
import '../../assets/styles/modal.css';

const RateSessionModal = ({ isOpen, onClose, session, onRate }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: ''
  });
  
  const [hoveredRating, setHoveredRating] = useState(0);
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

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Please select a rating from 1 to 5 stars';
    }
    
    if (formData.feedback && formData.feedback.length > 1000) {
      newErrors.feedback = 'Feedback cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onRate(formData);
    } catch (error) {
      console.error('Rating failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const ratingDescriptions = {
    1: 'The session did not meet expectations',
    2: 'The session was below average',
    3: 'The session met expectations',
    4: 'The session exceeded expectations',
    5: 'Outstanding session, highly recommend!'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Rate Your Session</h2>
            <p>Help others by sharing your learning experience</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        {/* Session Info */}
        {session && (
          <div className="modal-info-section">
            <div className="session-info completed">
              <div className="session-avatar">
                {session.otherParticipantName?.charAt(0) || 'T'}
              </div>
              <div>
                <h3>{session.title}</h3>
                <p className="session-details">
                  <span>👤 {session.otherParticipantName}</span>
                  <span>📚 {session.skill.name}</span>
                  <span>✅ Completed</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Rating */}
          <div className="form-group">
            <label className="form-label required">
              How was your session? *
            </label>
            
            <div className="rating-section">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${
                      star <= (hoveredRating || formData.rating) ? 'active' : ''
                    }`}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => handleRatingClick(star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              
              {(hoveredRating || formData.rating) > 0 && (
                <div className="rating-feedback">
                  <div className="rating-label">
                    {ratingLabels[hoveredRating || formData.rating]}
                  </div>
                  <div className="rating-description">
                    {ratingDescriptions[hoveredRating || formData.rating]}
                  </div>
                </div>
              )}
            </div>
            
            {errors.rating && (
              <span className="error-text">{errors.rating}</span>
            )}
          </div>

          {/* Feedback */}
          <div className="form-group">
            <label className="form-label">
              Share your experience (optional)
            </label>
            <textarea
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              rows={5}
              placeholder="What did you learn? How was the teaching style? Would you recommend this person to others?"
              className={`form-textarea ${errors.feedback ? 'error' : ''}`}
              maxLength={1000}
            />
            {errors.feedback && (
              <span className="error-text">{errors.feedback}</span>
            )}
            <div className="char-count">
              {formData.feedback.length}/1000
            </div>
            <div className="form-hint">
              Your feedback helps improve the community and helps others find great learning partners
            </div>
          </div>

          {/* Quick Feedback Options */}
          {formData.rating >= 4 && (
            <div className="quick-feedback-section">
              <label className="form-label">What made this session great?</label>
              <div className="quick-feedback-options">
                {[
                  'Clear explanation',
                  'Patient teaching',
                  'Well prepared',
                  'Good examples',
                  'Engaging style',
                  'Practical tips'
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="quick-feedback-btn"
                    onClick={() => {
                      const currentFeedback = formData.feedback;
                      const newFeedback = currentFeedback 
                        ? `${currentFeedback}${currentFeedback.endsWith('.') ? '' : '.'} ${option}.`
                        : `${option}.`;
                      setFormData(prev => ({ ...prev, feedback: newFeedback }));
                    }}
                  >
                    + {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="notice-card">
            <div className="notice-icon">🔒</div>
            <div>
              <h4>Your feedback matters</h4>
              <p>
                Reviews help build trust in our community. Your feedback will be visible to other users to help them make informed decisions.
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
              Skip Rating
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  ⭐ Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateSessionModal;
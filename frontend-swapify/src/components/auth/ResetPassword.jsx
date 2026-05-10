import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput';
import '../../assets/styles/verificationpage.css'; 

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      validateToken(urlToken);
    } else {
      setValidatingToken(false);
      setError('Invalid reset link. No token provided.');
    }
  }, [searchParams]);

  const validateToken = async (resetToken) => {
    try {
      const response = await fetch(`http://localhost:8081/api/auth/validate-reset-token?token=${resetToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTokenValid(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid or expired reset token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      setError('Unable to validate reset token. Please try again.');
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    
    const error = validatePassword(password);
    setPasswordError(error);
    
    // Check confirm password if it's already filled
    if (confirmPassword) {
      setConfirmError(password !== confirmPassword ? 'Passwords do not match' : '');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirm = e.target.value;
    setConfirmPassword(confirm);
    setConfirmError(newPassword !== confirm ? 'Passwords do not match' : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Final validation
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while validating token
  if (validatingToken) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="verification-header">
            <div className="icon-container">
              <div className="mail-icon">
                <div className="spinner"></div>
              </div>
            </div>
            <h1 className="verification-title">Validating Reset Link...</h1>
            <p className="verification-subtitle">Please wait while we verify your reset token</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="verification-page">
        <div className="verification-container success-container">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark"></div>
            </div>
          </div>
          <h1 className="success-title">Password Reset!</h1>
          <p className="success-message">
            Your password has been successfully updated.
          </p>
          <p style={{ color: '#64b5f6', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Redirecting to login page in 3 seconds...
          </p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (!tokenValid) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="verification-header">
            <div className="icon-container">
              <div className="mail-icon" style={{ background: 'linear-gradient(135deg, #ff5722 0%, #f44336 100%)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
            </div>
            
            <h1 className="verification-title" style={{ color: '#f44336' }}>Invalid Reset Link</h1>
            <p className="verification-subtitle" style={{ color: '#ff5722' }}>
              {error || 'This password reset link has expired or is invalid'}
            </p>
          </div>

          <div className="verification-footer">
            <p className="help-text">Need a new reset link?</p>
            
            <Link to="/forgot-password" className="verify-button" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Request New Reset Link
            </Link>
            
            <Link to="/login" className="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="verification-page">
      <div className="verification-container">
        
        {/* Header Section */}
        <div className="verification-header">
          <div className="icon-container">
            <div className="mail-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          
          <h1 className="verification-title">Reset Password</h1>
          <p className="verification-subtitle">
            Enter your new password below
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="status-message error-message">
            <div className="status-icon">⚠️</div>
            {error}
          </div>
        )}

        {/* Password Reset Form */}
        <form onSubmit={handleSubmit} className="code-section">
          <div style={{ marginBottom: '1.5rem' }}>
            <PasswordInput
              value={newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              required={true}
              disabled={loading}
              error={passwordError}
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <PasswordInput
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm New Password"
              required={true}
              disabled={loading}
              error={confirmError}
            />
          </div>
          
          <button 
            type="submit"
            className={`verify-button ${loading || !newPassword || !confirmPassword || passwordError || confirmError ? 'disabled' : ''}`}
            disabled={loading || !newPassword || !confirmPassword || passwordError || confirmError}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Updating Password...
              </div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        {/* Footer Section */}
        <div className="verification-footer">
          <Link to="/login" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
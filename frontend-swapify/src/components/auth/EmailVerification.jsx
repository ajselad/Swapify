import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../../assets/styles/auth.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/auth/verify-email?token=${verificationToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! Your account is now active.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Email verification failed. The link may be expired or invalid.');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      setStatus('error');
      setMessage('Email verification failed. Please check your connection and try again.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="verification-container">
            <div className="verification-icon">⏳</div>
            <h1 className="auth-title">Verifying Your Email...</h1>
            <p className="auth-subtitle">Please wait while we verify your email address.</p>
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="verification-container">
            <div className="verification-icon success">✅</div>
            <h1 className="auth-title">Email Verified!</h1>
            <p className="auth-subtitle">{message}</p>
            <p className="verification-instructions">
              Your account is now active and you can start using Swapify to connect with skill swappers in your community.
            </p>
            
            <div className="verification-actions">
              <Link to="/login" className="btn-primary">
                Sign In to Your Account
              </Link>
              
              <Link to="/" className="btn-secondary">
                Go to Homepage
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="verification-container">
            
            <h1 className="auth-title">Verification Failed</h1>
            <p className="auth-subtitle error-text">{message}</p>
            
            <div className="verification-actions">
              <Link to="/register" className="btn-primary">
                Register Again
              </Link>
              
              <Link to="/login" className="btn-secondary">
                Try to Sign In
              </Link>
            </div>
            
            <div className="help-section">
              <p>Need help?</p>
              <ul className="help-list">
                <li>Make sure you clicked the latest verification link</li>
                <li>Check if the link has expired (links expire after 24 hours)</li>
                <li>Try registering again with the same email</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-form-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
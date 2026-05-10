import React, { useState, useRef, useEffect } from 'react';
import '../../assets/styles/verificationpage.css'; 

const VerificationCodeInput = ({ email, onVerified, onResendCode, onBackToForm, isLogin = false }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  useEffect(() => {
    let interval = null;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();

    if (newCode.every(d => d !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify(code.join(''));
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString) => {
    if (codeString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isLogin
        ? `http://localhost:8081/api/auth/verify-code?email=${encodeURIComponent(email)}&code=${codeString}&action=login`
        : `http://localhost:8081/api/auth/verify-code?email=${encodeURIComponent(email)}&code=${codeString}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          if (data.token && data.token !== 'VERIFICATION_REQUIRED') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userPlan', data.plan.toLowerCase());
            localStorage.setItem(
              'userData',
              JSON.stringify({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                fullName: `${data.firstName} ${data.lastName}`.trim(),
              })
            );
            localStorage.setItem('userFirstName', data.firstName);
            localStorage.setItem('userLastName', data.lastName);
            localStorage.setItem('userEmail', data.email);
            setSuccess('Welcome back! Taking you to your dashboard...');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          }
        } else {
          setSuccess('Perfect! Your account is now verified.');
          setTimeout(() => {
            onVerified && onVerified();
          }, 2000);
        }
      } else {
        setError(data.message || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Something went wrong. Please check your connection.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const context = isLogin ? 'login' : 'registration';
      const response = await fetch(
        `http://localhost:8081/api/auth/resend-code?email=${encodeURIComponent(email)}&context=${context}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('✨ Fresh code sent to your inbox!');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setCountdown(60);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to resend. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackClick = () => {
    if (isLogin) {
      window.location.href = '/login';
    } else {
      if (onBackToForm) {
        onBackToForm();
      } else {
        window.location.href = '/register';
      }
    }
  };

  if (
    success &&
    (success.includes('Welcome') || success.includes('Perfect') || success.includes('Taking'))
  ) {
    return (
      <div className="verification-page">
        <div className="verification-container success-container">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark"></div>
            </div>
          </div>
          <h1 className="success-title">{isLogin ? 'Welcome Back!' : 'All Set!'}</h1>
          <p className="success-message">{success}</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="verification-header">
          <div className="icon-container">
            <div className="mail-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          <h1 className="verification-title">Check Your Email</h1>
          <p className="verification-subtitle">
            We sent a verification code to
            <br />
            <span className="email-highlight">{email}</span>
          </p>
        </div>

        {error && (
          <div className="status-message error-message">
            <div className="status-icon">⚠️</div>
            {error}
          </div>
        )}

        {success && !success.includes('Welcome') && !success.includes('Perfect') && (
          <div className="status-message success-message">
            <div className="status-icon">✨</div>
            {success}
          </div>
        )}

        <div className="code-section">
          <div className="code-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`code-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                disabled={loading}
                autoComplete="off"
              />
            ))}
          </div>

          <button
            onClick={() => handleVerify(code.join(''))}
            className={`verify-button ${loading || code.some((d) => !d) ? 'disabled' : ''}`}
            disabled={loading || code.some((digit) => !digit)}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>
        </div>

        <div className="verification-footer">
          <p className="help-text">Didn't receive it?</p>

          <button
            onClick={handleResend}
            className={`resend-button ${resendLoading || countdown > 0 ? 'disabled' : ''}`}
            disabled={resendLoading || countdown > 0}
          >
            {resendLoading ? (
              <>
                <div className="mini-spinner"></div>
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Send New Code'
            )}
          </button>

          <button
            onClick={handleBackClick}
            className="back-link"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back to {isLogin ? 'Login' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationCodeInput;

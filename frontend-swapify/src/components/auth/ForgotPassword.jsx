import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

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

  // Step 1: Send reset code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // Move to code verification step
        setSuccess('Reset code sent! Check your email for a 6-digit code.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to send reset code');
      }
    } catch (error) {
      console.error('Send code failed:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && value) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="code-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (codeString) => {
    if (codeString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8081/api/auth/validate-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: codeString
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3); // Move to password reset step
        setSuccess('Code verified! Now enter your new password.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Invalid or expired code');
        setCode(['', '', '', '', '', '']); // Clear code on error
      }
    } catch (error) {
      console.error('Code verification failed:', error);
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    
    const error = validatePassword(password);
    setPasswordError(error);
    
    if (confirmPassword) {
      setConfirmError(password !== confirmPassword ? 'Passwords do not match' : '');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirm = e.target.value;
    setConfirmPassword(confirm);
    setConfirmError(newPassword !== confirm ? 'Passwords do not match' : '');
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
          email,
          code: code.join(''),
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('New reset code sent!');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success && success.includes('successful')) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fbff 50%, #e1f5fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '24px', padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ width: '100px', height: '100px', margin: '0 auto 2rem', background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid white', borderTop: 'none', borderRight: 'none', transform: 'rotate(-45deg)' }}></div>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#1565c0', marginBottom: '1rem' }}>Password Reset!</h1>
          <p style={{ fontSize: '1.1rem', color: '#42a5f5', marginBottom: '2rem' }}>{success}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', background: '#2196f3', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
            <span style={{ width: '8px', height: '8px', background: '#2196f3', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}></span>
            <span style={{ width: '8px', height: '8px', background: '#2196f3', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fbff 50%, #e1f5fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '24px', padding: '3rem 2.5rem', boxShadow: '0 20px 40px rgba(33, 150, 243, 0.15), 0 8px 16px rgba(33, 150, 243, 0.1)', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)' }}>
            {step === 1 ? '🔄' : step === 2 ? '📧' : '🔒'}
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1565c0', marginBottom: '0.75rem' }}>
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter Reset Code' : 'Set New Password'}
          </h1>
          <p style={{ fontSize: '1rem', color: '#64b5f6', lineHeight: '1.6' }}>
            {step === 1 
              ? 'Enter your email to receive a reset code'
              : step === 2 
                ? `Enter the 6-digit code sent to ${email}`
                : 'Create your new password'
            }
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(255, 87, 87, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)', color: '#ff4757', border: '1px solid rgba(255, 87, 87, 0.2)' }}>
            <span>⚠️</span>
            {error}
          </div>
        )}
        
        {success && !success.includes('successful') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(102, 187, 106, 0.08) 100%)', color: '#27ae60', border: '1px solid rgba(76, 175, 80, 0.25)' }}>
            <span>✨</span>
            {success}
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: '2rem' }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: '1rem 1.25rem', border: '2px solid #e3f2fd', borderRadius: '12px', fontSize: '1rem', outline: 'none', background: 'white', color: '#1565c0', fontWeight: '500' }}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || !email}
              style={{ width: '100%', padding: '1rem 2rem', background: loading || !email ? '#90caf9' : 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '600', cursor: loading || !email ? 'not-allowed' : 'pointer', minHeight: '56px' }}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Code Input */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  name={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  style={{ width: '50px', height: '60px', border: '2px solid #e3f2fd', borderRadius: '12px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', color: '#1565c0', background: 'white', outline: 'none' }}
                />
              ))}
            </div>
            
            <button 
              onClick={() => handleVerifyCode(code.join(''))}
              disabled={loading || code.some(digit => !digit)}
              style={{ width: '100%', padding: '1rem 2rem', background: loading || code.some(d => !d) ? '#90caf9' : 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '600', cursor: loading || code.some(d => !d) ? 'not-allowed' : 'pointer', minHeight: '56px', marginBottom: '1rem' }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button 
              onClick={handleResendCode}
              disabled={loading}
              style={{ background: 'none', border: '2px solid #e3f2fd', color: '#2196f3', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '500', cursor: 'pointer' }}
            >
              {loading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        )}

        {/* Step 3: Password Input */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
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
              disabled={loading || !newPassword || !confirmPassword || passwordError || confirmError}
              style={{ width: '100%', padding: '1rem 2rem', background: loading || !newPassword || !confirmPassword || passwordError || confirmError ? '#90caf9' : 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: '600', cursor: loading || !newPassword || !confirmPassword || passwordError || confirmError ? 'not-allowed' : 'pointer', minHeight: '56px' }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{ marginTop: '2rem' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64b5f6', textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem', borderRadius: '8px' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
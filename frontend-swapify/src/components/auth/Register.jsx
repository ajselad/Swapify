import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput';
import VerificationCodeInput from './VerificationCodeInput';
import '../../assets/styles/auth.css';
import registerImage from '../../assets/images/login-image.jpg';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const suggestedPlan = queryParams.get('plan') || 'free';
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(suggestedPlan);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Enhanced email validation
  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    
    if (!email) {
      return 'Email is required';
    }
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    const domain = email.split('@')[1]?.toLowerCase();
    
    // Block common fake domains
    const blockedDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
      'tempmail.org', 'temp-mail.org', 'throwaway.email', 
      'fakeinbox.com', 'fake.fake', 'test.test', 'invalid.com',
      'nowhere.com', 'nonexistent.xyz'
    ];
    
    if (blockedDomains.includes(domain)) {
      return 'Disposable email addresses are not allowed. Please use a valid email address';
    }

    // Check for suspicious patterns
    if (domain && (
      domain.includes('fake') || 
      domain.includes('test') || 
      domain.includes('temp') ||
      domain.includes('disposable') ||
      domain.length < 4
    )) {
      return 'Please use a valid email address with a real domain';
    }

    return '';
  };

  // Enhanced password validation
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

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    const emailError = validateEmail(newEmail);
    setErrors({
      ...errors,
      email: emailError
    });
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    const passwordError = validatePassword(newPassword);
    setErrors({
      ...errors,
      password: passwordError
    });
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    setErrors({
      ...errors,
      confirmPassword: password !== newConfirmPassword ? 'Passwords do not match' : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = password !== confirmPassword ? 'Passwords do not match' : '';
    
    let firstNameError = '';
    let lastNameError = '';
    
    if (!firstName.trim()) {
      firstNameError = 'First name is required';
    } else if (firstName.trim().length < 1) {
      firstNameError = 'First name must be at least 1 character';
    }
    
    if (!lastName.trim()) {
      lastNameError = 'Last name is required';
    } else if (lastName.trim().length < 1) {
      lastNameError = 'Last name must be at least 1 character';
    }
    
    if (emailError || passwordError || confirmError || firstNameError || lastNameError) {
      setErrors({
        firstName: firstNameError,
        lastName: lastNameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError
      });
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email, 
          password, 
          plan: selectedPlan.toUpperCase() 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Show verification code input instead of success message
        setShowVerificationInput(true);
        setRegisteredEmail(email);
        // Keep form data in case user wants to go back
      } else {
        setErrors({
          form: data.message || 'Registration failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({
        form: 'Registration failed. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    navigate('/login');
  };

  const handleResendCode = async () => {
    const response = await fetch(`http://localhost:8081/api/auth/resend-code?email=${registeredEmail}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to resend verification code');
    }
  };

  const handleBackToRegisterForm = () => {
    console.log('🔄 Going back to registration form');
    setShowVerificationInput(false);
    setRegisteredEmail('');
    setErrors({});
  };

  if (showVerificationInput) {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-form-content">
            <VerificationCodeInput 
              email={registeredEmail}
              onVerified={handleVerificationSuccess}
              onResendCode={handleResendCode}
              onBackToForm={handleBackToRegisterForm} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-image-container">
        <img src={registerImage} alt="Security illustration" className="auth-image" />
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-content">
          <h1 className="auth-title">Welcome to Swapify!</h1>
          <p className="auth-subtitle">Create your Account</p>
          
          {errors.form && <div className="error-message">{errors.form}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <div className="input-with-icon">
                  <div className="input-icon">
                    👤
                  </div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={`auth-input ${errors.firstName ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <div className="input-with-icon">
                  <div className="input-icon">
                    👤
                  </div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className={`auth-input ${errors.lastName ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <div className="input-with-icon">
                
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`auth-input ${errors.email ? 'input-error' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <PasswordInput
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required={true}
              disabled={loading}
              error={errors.password}
            />
            
            <PasswordInput
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm Password"
              required={true}
              disabled={loading}
              error={errors.confirmPassword}
            />
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
            
            <div className="auth-alternate">
              <p className="already-account">Already have an account?</p>
              <Link to="/login" className="btn-secondary">SIGN IN</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
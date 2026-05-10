import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import PasswordInput from '../PasswordInput';
import '../../assets/styles/auth.css';
import loginImage from '../../assets/images/login-image.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token === "VERIFICATION_REQUIRED") {
          console.log('Credentials verified, verification code sent to email');
          navigate('/verify', { 
            state: { 
              email: email, 
              isLogin: true,
              message: 'Verification code sent to your email. Please check your inbox.'
            } 
          });
        } else {
          // Store all user data first
          localStorage.setItem('token', data.token);
          localStorage.setItem('userPlan', data.plan?.toLowerCase() || 'free');
          localStorage.setItem('userData', JSON.stringify({
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            fullName: `${data.firstName} ${data.lastName}`.trim()
          }));
          localStorage.setItem('userFirstName', data.firstName);
          localStorage.setItem('userLastName', data.lastName);
          localStorage.setItem('userEmail', data.email);
          localStorage.setItem('userRole', data.role || 'USER');

          console.log('Login successful, stored data:', {
            token: !!data.token,
            role: data.role,
            firstName: data.firstName,
            email: data.email
          });

        
          navigate('/dashboard');
        }
      } else {
        console.log('Login failed - Response not OK:', data);
        setError(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login failed with error:', error);
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-container">
        <img src={loginImage} alt="Security illustration" className="auth-image" />
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-content">
          <h1 className="auth-title">Welcome to Swapify!</h1>
          <p className="auth-subtitle">Sign in to your Account</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                disabled={loading}
              />
            </div>
            
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required={true}
              disabled={loading}
              error=""
            />
            
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
            
            <div className="auth-alternate">
              <Link to="/register" className="btn-secondary">SIGN UP</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
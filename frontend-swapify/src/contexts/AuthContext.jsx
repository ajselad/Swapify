import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Base API URL - matches your Spring Boot backend
  const API_BASE_URL = 'http://localhost:8081/api/auth';
  
  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserPlan = localStorage.getItem('userPlan');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
        if (storedUserPlan) {
          setUserPlan(storedUserPlan);
        }
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('userPlan');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);
  
  // Login function - FIXED to handle admin users properly
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Check if verification is required
        if (data.token === "VERIFICATION_REQUIRED") {
          console.log('Login verification required');
          // Store temporary data for verification process
          localStorage.setItem('tempEmail', data.email);
          localStorage.setItem('tempUserData', JSON.stringify({
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role
          }));
          
          return { 
            success: false, 
            verificationRequired: true,
            email: data.email
          };
        }
        
        // Complete login - store everything properly
        localStorage.setItem('token', data.token);
        localStorage.setItem('userPlan', data.plan ? data.plan.toLowerCase() : 'free');
        localStorage.setItem('userData', JSON.stringify({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role || 'USER'  // IMPORTANT: Store role
        }));
        
        // Update state
        setCurrentUser({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role || 'USER'
        });
        setUserPlan(data.plan ? data.plan.toLowerCase() : 'free');
        
        // FIXED: Redirect based on role
        if (data.role === 'ADMIN') {
          console.log('Admin user detected, redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('Regular user, redirecting to dashboard');
          navigate('/dashboard');
        }
        
        return { success: true };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // NEW: Handle verification code for login
  const verifyLoginCode = async (email, code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code?email=${encodeURIComponent(email)}&code=${code}&action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Complete login after verification
        localStorage.setItem('token', data.token);
        localStorage.setItem('userPlan', data.plan ? data.plan.toLowerCase() : 'free');
        localStorage.setItem('userData', JSON.stringify({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role || 'USER'
        }));
        
        // Update state
        setCurrentUser({
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role || 'USER'
        });
        setUserPlan(data.plan ? data.plan.toLowerCase() : 'free');
        
        // Clear temporary data
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('tempUserData');
        
        // Redirect based on role
        if (data.role === 'ADMIN') {
          console.log('Admin user verified, redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('Regular user verified, redirecting to dashboard');
          navigate('/dashboard');
        }
        
        return { success: true };
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };
  
  // Register function - NO immediate login, user must verify email
  const register = async (firstName, lastName, email, password, plan = 'FREE') => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          firstName,
          lastName,
          email, 
          password, 
          plan: plan.toUpperCase() 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Registration successful - email verification required');
        
        return { 
          success: true, 
          message: data.message || 'Registration successful! Please check your email to verify your account.',
          email: email
        };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };
  
  // Email verification function
  const verifyEmail = async (email, code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code?email=${encodeURIComponent(email)}&code=${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  };
  
  // Resend verification email
  const resendVerificationCode = async (email, context = null) => {
    try {
      const url = context 
        ? `${API_BASE_URL}/resend-code?email=${encodeURIComponent(email)}&context=${context}`
        : `${API_BASE_URL}/resend-code?email=${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  };
  
  // Function to upgrade plan
  const upgradeToPro = async () => {
    try {
      setUserPlan('pro');
      localStorage.setItem('userPlan', 'pro');
      console.log('Plan upgraded to Pro!');
      
      return { success: true };
    } catch (error) {
      console.error('Plan upgrade failed:', error);
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setCurrentUser(null);
      setUserPlan(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userPlan');
      localStorage.removeItem('userData');
      localStorage.removeItem('tempEmail');
      localStorage.removeItem('tempUserData');
      navigate('/');
    }
  };
  
  // Check if user has access to premium features
  const hasPremiumAccess = () => {
    return userPlan === 'pro';
  };
  
  // Value to be provided by the context
  const value = {
    currentUser,
    userPlan,
    login,
    register,
    verifyEmail,
    verifyLoginCode,
    resendVerificationCode,
    logout,
    upgradeToPro,
    hasPremiumAccess,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;
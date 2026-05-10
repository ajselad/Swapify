import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

function AdminProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      // FIRST: Decode the JWT token
      const decodedToken = decodeToken(token);
      console.log('Decoded JWT:', decodedToken);

      // Check expiration
      if (decodedToken?.exp && decodedToken.exp * 1000 < Date.now()) {
        setError('Authentication token has expired');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setLoading(false);
        return;
      }

      // Check role from token (case-insensitive)
      const tokenRole = decodedToken?.role?.toUpperCase();
      if (tokenRole === 'ADMIN') {
        console.log('User is admin (from token)');
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // FALLBACK: Check with backend if role is not present or unclear
      try {
        const response = await fetch('http://localhost:8081/api/profile/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Backend user data:', userData);

          if ((userData.role || '').toUpperCase() === 'ADMIN') {
            setIsAuthorized(true);
          } else {
            setError('Admin privileges required');
          }
        } else {
          setError('Failed to verify user role from backend');
        }
      } catch (err) {
        console.error('Error checking admin role from backend:', err);
        setError('Error verifying admin access');
      }

      setLoading(false);
    };

    verifyAdminAccess();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ fontSize: '18px' }}>Verifying admin access...</div>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          Please wait while we check your permissions.
        </div>
      </div>
    );
  }

  if (error || !isAuthorized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '2rem',
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Access Denied</h2>
          <p style={{ marginBottom: '1rem' }}>
            {error || 'You do not have admin privileges to access this area.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/login';
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminProtectedRoute;

import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // Adjust path as needed
import '../assets/styles/navbar.css'; 

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = () => {
      const userRole = localStorage.getItem('userRole');
      const isUserAdmin = userRole?.toUpperCase() === 'ADMIN';
      setIsAdmin(isUserAdmin);
      console.log('Navbar admin check:', { userRole, isUserAdmin });
    };

    checkAdminStatus();
    
    // Listen for storage changes (when user logs in/out)
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []);

  // ADDED: Listen for admin role changes
  useEffect(() => {
    const handleAdminRoleChange = () => {
      const userRole = localStorage.getItem('userRole');
      const isUserAdmin = userRole?.toUpperCase() === 'ADMIN';
      setIsAdmin(isUserAdmin);
      console.log('Navbar admin status updated via event:', { userRole, isUserAdmin });
    };

    // Listen for custom events when admin role changes
    window.addEventListener('adminRoleChanged', handleAdminRoleChange);
    
    return () => {
      window.removeEventListener('adminRoleChanged', handleAdminRoleChange);
    };
  }, []);

  // ADDED: Also check role from JWT token on component mount
  useEffect(() => {
    const checkRoleFromToken = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode JWT token to get role
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decodedToken = JSON.parse(jsonPayload);
          
          if (decodedToken.role) {
            // Update localStorage with role from token
            localStorage.setItem('userRole', decodedToken.role);
            const isUserAdmin = decodedToken.role?.toUpperCase() === 'ADMIN';
            setIsAdmin(isUserAdmin);
            console.log('Navbar admin check from JWT token:', { 
              role: decodedToken.role, 
              isUserAdmin 
            });
          }
        } catch (error) {
          console.error('Error decoding JWT token:', error);
        }
      }
    };

    checkRoleFromToken();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleAdminClick = () => {
    navigate('/admin/dashboard');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null || currentUser;

  // Get user info for profile
  const getUserDisplayName = () => {
    if (currentUser) {
      return currentUser.displayName || currentUser.firstName || 'User';
    }
    return localStorage.getItem('userFirstName') || 'User';
  };

  const getUserProfileImage = () => {
    if (currentUser && currentUser.profileImageUrl) {
      return currentUser.profileImageUrl;
    }
    // Fallback to generated avatar
    const userName = getUserDisplayName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=40`;
  };

  return (
    <div className="navbar-wrapper">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            Swapify
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="navbar-menu">
          <Link to="/" className="nav-item active">Home</Link>
          <Link to="/explore" className="nav-item">Explore</Link>
          <Link to="/my-sessions" className="nav-item">My Sessions</Link>
          <Link to="/messages" className="nav-item">Messages</Link>
          
          {/* Admin Button - Only visible to admins */}
          {isAuthenticated && isAdmin && (
            <button 
              onClick={handleAdminClick}
              className="nav-item admin-nav-button"
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                marginLeft: '0.5rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
              }}
            >
               Admin
            </button>
          )}
        </nav>

        {/* Auth Section - Shows different content based on login status */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="profile-menu" ref={profileMenuRef}>
              <button 
                className="profile-button" 
                onClick={toggleProfileMenu}
              >
                <img 
                  src={getUserProfileImage()}
                  alt={getUserDisplayName()}
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=6366f1&color=fff&size=32`;
                  }}
                />
                <span>
                  {getUserDisplayName()}
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ 
                    transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <h4>{getUserDisplayName()}</h4>
                    <p>{currentUser?.email || localStorage.getItem('userEmail') || 'user@example.com'}</p>
                    {/* ADDED: Show admin badge in dropdown */}
                    {isAdmin && (
                      <div style={{
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginTop: '0.5rem',
                        display: 'inline-block'
                      }}>
                         ADMIN
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-dropdown-menu">
                    <Link 
                      to="/dashboard" 
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>🏠</span>
                      Dashboard
                    </Link>
                    
                    <Link 
                      to="/profile/settings" 
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>⚙️</span>
                      Profile Settings
                    </Link>
                    
                    <Link 
                      to="/my-sessions" 
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <span>📚</span>
                      My Sessions
                    </Link>

                    {/* Admin option in dropdown too */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/admin/dashboard');
                        }}
                        className="dropdown-item admin-dropdown-item"
                        style={{
                          color: '#e74c3c',
                          fontWeight: '600'
                        }}
                      >
                        <span>🛡️</span>
                        Admin Dashboard
                      </button>
                    )}
                  </div>

                  <div className="profile-dropdown-footer">
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('userFirstName');
                        localStorage.removeItem('userLastName');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userData');
                        localStorage.removeItem('userPlan');
                        window.location.href = '/';
                      }}
                      className="dropdown-item logout"
                    >
                      <span>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="auth-login">Login</Link>
              <Link to="/register" className="auth-signup">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-toggle" 
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
        >
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-navbar">
          <div className="mobile-menu-items">
            <Link to="/" className="mobile-item active">Home</Link>
            <Link to="/explore" className="mobile-item">Explore</Link>
            <Link to="/my-sessions" className="mobile-item">My Sessions</Link>
            <Link to="/messages" className="mobile-item">Messages</Link>
            
            {/* Mobile Admin Button */}
            {isAuthenticated && isAdmin && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/admin/dashboard');
                }}
                className="mobile-item admin-mobile-item"
                style={{
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}
              >
                🛡️ Admin Dashboard
              </button>
            )}
            
            {/* Mobile Profile Section */}
            {isAuthenticated ? (
              <div className="mobile-profile">
                <Link to="/dashboard" className="mobile-item">Dashboard</Link>
                <Link to="/profile/settings" className="mobile-item">Profile Settings</Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userFirstName');
                    localStorage.removeItem('userLastName');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userData');
                    localStorage.removeItem('userPlan');
                    window.location.href = '/';
                  }}
                  className="mobile-item logout"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth">
                <Link to="/login" className="mobile-login">Login</Link>
                <Link to="/register" className="mobile-signup">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
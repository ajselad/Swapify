import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/styles/AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userPlan');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Admin Panel</h2>
        </div>
        
        <div className="sidebar-nav">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link 
                to="/admin/dashboard" 
                className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
              >
                <span className="nav-icon">📊</span>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/admin/users" 
                className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
              >
                <span className="nav-icon">👥</span>
                Users
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="logout-section">
          <button 
            onClick={handleLogout} 
            className="logout-button"
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
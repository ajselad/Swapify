import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/apiService';
import '../../assets/styles/AdminDashboard.css';
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboardStats()
      .then(res => {
        console.log('Dashboard stats response:', res);
        setStats(res);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading dashboard stats:', err);
        const errorMsg = err.message || 'Failed to load dashboard statistics';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="loading-container">
        <div>No statistics available</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <h3>Total Users</h3>
          <div className="stat-number">
            {stats.totalUsers || 0}
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <h3>Verified Users</h3>
          <div className="stat-number">
            {stats.verifiedUsers || 0}
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <h3>Active Teachers</h3>
          <div className="stat-number">
            {stats.activeTeachers || 0}
          </div>
        </div>
      </div>

      <div className="overview-section">
        <h3>System Overview</h3>
        <div className="overview-grid">
          <div>
            <strong>User Verification Rate:</strong>
            <span className="overview-value">
              {stats.totalUsers > 0 
                ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%` 
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <strong>Teacher Adoption Rate:</strong>
            <span className="overview-value">
              {stats.verifiedUsers > 0 
                ? `${Math.round((stats.activeTeachers / stats.verifiedUsers) * 100)}%` 
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <h3>Quick Actions</h3>
        <div className="actions-buttons">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="action-button action-button-primary"
          >
            Manage Users
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="action-button action-button-success"
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}
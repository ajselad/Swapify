import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/apiService';
import { Link } from 'react-router-dom';
import '../../assets/styles/AdminUsersList.css';

export default function AdminUsersList() {
  const [usersPage, setUsersPage] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    adminAPI.getAllUsers(page, size, search)
      .then(res => {
        console.log('Users response:', res);
        setUsersPage(res);
      })
      .catch(err => {
        console.error('Error loading users:', err);
        const errorMsg = err.message || 'Failed to load users';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, refreshFlag]);

  const handlePromote = (id) => {
    if (!window.confirm('Are you sure you want to promote this user to admin?')) return;
    
    adminAPI.promoteUser(id)
      .then(() => {
        alert('User promoted to admin successfully');
        setRefreshFlag(f => !f);
      })
      .catch(err => {
        const errorMsg = err.message || 'Failed to promote user';
        alert('Error: ' + errorMsg);
      });
  };

  const handleDemote = (id) => {
    if (!window.confirm('Are you sure you want to remove admin privileges from this user?')) return;
    
    adminAPI.demoteUser(id)
      .then(() => {
        alert('Admin privileges removed successfully');
        setRefreshFlag(f => !f);
      })
      .catch(err => {
        const errorMsg = err.message || 'Failed to remove admin privileges';
        alert('Error: ' + errorMsg);
      });
  };

  

  const handleToggleStatus = (id, currentStatus, userEmail) => {
    const action = currentStatus ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} user: ${userEmail}?`)) return;
    
    adminAPI.toggleUserStatus(id)
      .then((response) => {
        const message = response.message || `User ${action}d successfully`;
        alert(message);
        setRefreshFlag(f => !f);
      })
      .catch(err => {
        const errorMsg = err.message || `Failed to ${action} user`;
        alert('Error: ' + errorMsg);
      });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const totalPages = usersPage ? usersPage.totalPages : 0;
  const totalElements = usersPage ? usersPage.totalElements : 0;

  return (
    <div className="admin-users-list">
      <div className="header-section">
        <h1>Users Management</h1>
        <p>Total Users: {totalElements}</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, email..."
          value={search}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {error && (
        <div className="error-container">
          {error}
        </div>
      )}

      {loading && <div className="loading-container">Loading users...</div>}

      {!loading && usersPage && (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersPage.content.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="user-email-link"
                      >
                        {user.email}
                      </Link>
                    </td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>
                      <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                        {user.role || 'USER'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.enabled ? 'status-active' : 'status-disabled'}`}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <span className={`verification-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                        {user.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-buttons">
                        {user.role === 'ADMIN' ? (
                          <button 
                            onClick={() => handleDemote(user.id)}
                            className="action-button demote-button"
                          >
                            Demote
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePromote(user.id)}
                            className="action-button promote-button"
                          >
                            Promote
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.enabled, user.email)}
                          className={`action-button ${user.enabled ? 'disable-button' : 'enable-button'}`}
                        >
                          {user.enabled ? 'Disable' : 'Enable'}
                        </button>
                        
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
        </>
      )}
    </div>
  );
}
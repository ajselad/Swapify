import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import Home from './components/home/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import VerifyPage from './components/auth/VerifyPage';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import ExploreFreePlan from './components/explore/ExploreFreePlan';

import ProfileSettings from './components/profile/ProfileSettings';
import SessionsPageComplete from './components/sessions/SessionsPageComplete';
import MessagesPage from './components/messages/MessagesPage';
import Navbar from './components/Navbar';

import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsersList from './components/admin/AdminUsersList';
import AdminUserDetails from './components/admin/AdminUserDetails';

import './App.css';

// Layout with navbar for non-dashboard pages
const MainLayout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main style={{ margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{ 
        background: 'white', 
        color: 'white', 
        padding: '2rem 1rem', 
        marginTop: '2rem' 
      }}>
        <div style={{ color:'black', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} Swapify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Basic Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  
  return children;
};

// Updated Explore redirect component - now redirects pro users to free plan
const ExploreRedirect = () => {
  // Since ExploreProPlan is deleted, redirect all users to free plan
  return <Navigate to="/explore-free" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Home Route with MainLayout */}
          <Route path="/" element={
            <MainLayout>
              <Home />
            </MainLayout>
          } />
          
          {/* Dashboard Route - without navbar */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Auth Routes - WITHOUT navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Profile Routes - Protected */}
          <Route path="/profile/settings" element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } />
          
          {/* Explore Routes */}
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExploreRedirect />
            </ProtectedRoute>
          } />
          
          <Route path="/explore-free" element={
            <ProtectedRoute>
              <MainLayout>
                <ExploreFreePlan />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Sessions Route */}
          <Route path="/my-sessions" element={
            <ProtectedRoute>
              <MainLayout>
                <SessionsPageComplete />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Messages Route */}
          <Route path="/messages" element={
            <ProtectedRoute>
              <MainLayout>
                <MessagesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Settings route placeholder */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <div style={{ 
                  minHeight: '70vh', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <h2>Settings</h2>
                  <p>Coming soon! This feature is under development.</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - FIXED NESTED ROUTING */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersList />} />
            <Route path="users/:userId" element={<AdminUserDetails />} />
          </Route>

          {/* Redirect all other routes to Home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
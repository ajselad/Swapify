// EMERGENCY FIX - Complete apiService.js with ALL original functionality
const API_BASE_URL = 'http://localhost:8081/api';

// Helper functions
const handleResponse = async (response) => {
  if (response.ok) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } else {
    const errorData = await response.text();
    let errorMessage;
    try {
      const parsed = JSON.parse(errorData);
      errorMessage = parsed.message || 'Request failed';
    } catch {
      errorMessage = errorData || 'Request failed';
    }
    throw new Error(errorMessage);
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// COMPLETE SESSIONS API - RESTORED
export const sessionsAPI = {
  bookSession: async (sessionData) => {
    console.log('📤 API: Booking session:', sessionData);
    
    if (!sessionData.teacherId) throw new Error('Teacher ID is required');
    if (!sessionData.skillId) throw new Error('Skill ID is required');
    
    const response = await fetch(`${API_BASE_URL}/sessions/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session booked successfully:', result);
    return result;
  },

  respondToSession: async (sessionId, responseData) => {
    console.log('📤 API: Responding to session:', sessionId, responseData);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(responseData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session response sent:', result);
    return result;
  },

  scheduleSession: async (sessionId, scheduleData) => {
    console.log('📤 API: Scheduling session:', sessionId, scheduleData);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session scheduled:', result);
    return result;
  },

  rescheduleSession: async (sessionId, rescheduleData) => {
    console.log('📤 API: Rescheduling session:', sessionId, rescheduleData);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/reschedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rescheduleData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session rescheduled:', result);
    return result;
  },

  completeSession: async (sessionId) => {
    console.log('📤 API: Completing session:', sessionId);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session completed:', result);
    return result;
  },

  cancelSession: async (sessionId, cancellationData) => {
    console.log('📤 API: Cancelling session:', sessionId, cancellationData);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cancellationData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session cancelled:', result);
    return result;
  },

  rateSession: async (sessionId, ratingData) => {
    console.log('📤 API: Rating session:', sessionId, ratingData);
    
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ratingData)
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Session rated:', result);
    return result;
  },

  getUserSessions: async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });
    
    const response = await fetch(`${API_BASE_URL}/sessions/my?${params}`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved user sessions:', result);
    return result;
  },

  getSessionsAsStudent: async (page = 0, size = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/sessions/as-student?${params}`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved sessions as student:', result);
    return result;
  },

  getSessionsAsTeacher: async (page = 0, size = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/sessions/as-teacher?${params}`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved sessions as teacher:', result);
    return result;
  },

  getSessionsNeedingAction: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/actions-needed`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved sessions needing action:', result);
    return result;
  },

  getUpcomingSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/upcoming`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved upcoming sessions:', result);
    return result;
  },

  getSessionsToRate: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/to-rate`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved sessions to rate:', result);
    return result;
  },

  // MISSING FUNCTION - ADDED BACK
  getSessionStats: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/stats`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved session stats:', result);
    return result;
  },

  getSession: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved session:', result);
    return result;
  },

  getMeetingInfo: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/meeting-info`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    console.log('✅ API: Retrieved meeting info:', result);
    return result;
  },

  getMyAvailability: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/availability`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getTeacherAvailability: async (teacherId) => {
    const response = await fetch(`${API_BASE_URL}/sessions/availability/${teacherId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  setAvailability: async (availabilityData) => {
    const response = await fetch(`${API_BASE_URL}/sessions/availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(availabilityData)
    });
    return handleResponse(response);
  },

  removeAvailability: async (availabilityId) => {
    const response = await fetch(`${API_BASE_URL}/sessions/availability/${availabilityId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// AUTH API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  register: async (firstName, lastName, email, password, plan = 'FREE') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, plan: plan.toUpperCase() })
    });
    return handleResponse(response);
  },

  verifyCode: async (email, code, action = null) => {
    const url = action 
      ? `${API_BASE_URL}/auth/verify-code?email=${encodeURIComponent(email)}&code=${code}&action=${action}`
      : `${API_BASE_URL}/auth/verify-code?email=${encodeURIComponent(email)}&code=${code}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  resendVerificationCode: async (email, context = null) => {
    const url = context 
      ? `${API_BASE_URL}/auth/resend-code?email=${encodeURIComponent(email)}&context=${context}`
      : `${API_BASE_URL}/auth/resend-code?email=${encodeURIComponent(email)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// EXPLORE API - RESTORED
export const exploreAPI = {
  getSkillSwaps: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.skill) queryParams.append('skill', params.skill);
    if (params.category && params.category !== 'All Categories' && params.category !== 'All') {
      queryParams.append('category', params.category);
    }
    if (params.search) queryParams.append('search', params.search);
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    
    const url = `${API_BASE_URL}/explore/swaps${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  searchUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.location) queryParams.append('location', params.location);
    if (params.availableToTeach !== undefined) queryParams.append('availableToTeach', params.availableToTeach);
    if (params.lookingToLearn !== undefined) queryParams.append('lookingToLearn', params.lookingToLearn);
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    
    const url = `${API_BASE_URL}/explore/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  getPopularSkills: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/explore/popular-skills?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/explore/categories`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSkillSuggestions: async (query, limit = 5) => {
    const queryParams = new URLSearchParams({
      query: query,
      limit: limit
    });
    const response = await fetch(`${API_BASE_URL}/explore/skill-suggestions?${queryParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSwapsByCategory: async (category, page = 0, size = 12) => {
    const response = await fetch(`${API_BASE_URL}/explore/categories/${encodeURIComponent(category)}/swaps?page=${page}&size=${size}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// SKILLS API
export const skillsAPI = {
  getAllSkills: async () => {
    const response = await fetch(`${API_BASE_URL}/skills/all`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSkillsByCategory: async (category) => {
    const response = await fetch(`${API_BASE_URL}/skills/category/${encodeURIComponent(category)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  searchSkills: async (query) => {
    const response = await fetch(`${API_BASE_URL}/skills/search?query=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSkill: async (skillId) => {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMySkills: async () => {
    const response = await fetch(`${API_BASE_URL}/skills/my-skills`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMyGoals: async () => {
    const response = await fetch(`${API_BASE_URL}/skills/my-goals`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  addSkill: async (skillData) => {
    const response = await fetch(`${API_BASE_URL}/skills/add-skill`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(skillData)
    });
    return handleResponse(response);
  },

  addGoal: async (goalData) => {
    const response = await fetch(`${API_BASE_URL}/skills/add-goal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goalData)
    });
    return handleResponse(response);
  }
};

// PROFILE API
export const profileAPI = {
  getMyProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateMyProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  getCompletionStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/profile/completion-status`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUserProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// DASHBOARD API
export const dashboardAPI = {
  getDashboardOverview: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getRecentMessages: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-messages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getRecommendedUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/recommended-users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUpcomingSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/upcoming-sessions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// MESSAGE API
export const messageAPI = {
  getConversations: async (page = 0, size = 20) => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations?page=${page}&size=${size}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  startConversation: async (recipientId, initialMessage) => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientId, initialMessage })
    });
    return handleResponse(response);
  },

  getConversation: async (conversationId) => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMessages: async (conversationId, page = 0, size = 50) => {
    const response = await fetch(
      `${API_BASE_URL}/messages/conversations/${conversationId}/messages?page=${page}&size=${size}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  sendMessage: async (conversationId, messageData) => {
    const formData = new FormData();
    
    if (messageData.content) formData.append('content', messageData.content);
    if (messageData.replyToMessageId) formData.append('replyToMessageId', messageData.replyToMessageId);
    if (messageData.attachments && messageData.attachments.length > 0) {
      messageData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/messages/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }
    );
    return handleResponse(response);
  },

  editMessage: async (messageId, content) => {
    const response = await fetch(`${API_BASE_URL}/messages/messages/${messageId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    return handleResponse(response);
  },

  deleteMessage: async (messageId) => {
    const response = await fetch(`${API_BASE_URL}/messages/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAsRead: async (conversationId) => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  archiveConversation: async (conversationId) => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/archive`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  searchMessages: async (query, page = 0, size = 20) => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/messages/search?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getConversationStats: async () => {
    const response = await fetch(`${API_BASE_URL}/messages/stats/conversations`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMessageStats: async () => {
    const response = await fetch(`${API_BASE_URL}/messages/stats/messages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  searchUsers: async (query) => {
    const response = await fetch(`${API_BASE_URL}/messages/users/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateOnlineStatus: async (isOnline) => {
    const response = await fetch(`${API_BASE_URL}/messages/users/online-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ online: isOnline })
    });
    return handleResponse(response);
  },

  updateLastSeen: async () => {
    const response = await fetch(`${API_BASE_URL}/messages/users/last-seen`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ADMIN API - UPDATED WITH TOKEN HANDLING
export const adminAPI = {
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAllUsers: async (page = 0, size = 20, search = '', filter = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: 'id',
      sortDir: 'desc'
    });
    
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);
    
    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUserDetails: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  promoteUser: async (userId) => {
    console.log('🔧 Promoting user:', userId);
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/promote`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    
    // UPDATED: Handle new token if provided
    if (result.token) {
      console.log('🔑 Updating token and role after promotion');
      localStorage.setItem('token', result.token);
      localStorage.setItem('userRole', 'ADMIN');
      
      // Also update userData if it exists
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        parsedData.role = 'ADMIN';
        localStorage.setItem('userData', JSON.stringify(parsedData));
      }
      
      // Trigger navbar update
      window.dispatchEvent(new CustomEvent('adminRoleChanged'));
    }
    
    return result;
  },

  demoteUser: async (userId) => {
    console.log('🔧 Demoting user:', userId);
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/demote`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await handleResponse(response);
    
    // UPDATED: Handle new token if provided
    if (result.token) {
      console.log('🔑 Updating token and role after demotion');
      localStorage.setItem('token', result.token);
      localStorage.setItem('userRole', 'USER');
      
      // Also update userData if it exists
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        parsedData.role = 'USER';
        localStorage.setItem('userData', JSON.stringify(parsedData));
      }
      
      // Trigger navbar update
      window.dispatchEvent(new CustomEvent('adminRoleChanged'));
    }
    
    return result;
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  toggleUserStatus: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAdminLogs: async (page = 0, size = 50) => {
    const response = await fetch(`${API_BASE_URL}/admin/logs?page=${page}&size=${size}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ERROR HANDLER
export const handleApiError = (error, context = '') => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  const message = error.message || error.toString();
  
  if (message.includes('401') || message.includes('Unauthorized')) {
    localStorage.removeItem('token');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return 'Please log in again to continue.';
  } else if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to access this resource.';
  } else if (message.includes('404') || message.includes('Not Found')) {
    return 'The requested resource was not found.';
  } else if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Server error. Please try again later.';
  } else {
    return message || 'Something went wrong. Please try again.';
  }
};

export default { 
  authAPI, 
  exploreAPI, 
  sessionsAPI, 
  skillsAPI, 
  profileAPI, 
  handleApiError, 
  dashboardAPI, 
  messageAPI, 
  adminAPI 
};
// Complete Working ExploreFreePlan.jsx with UserProfile integration
import React, { useState, useEffect } from 'react';
import { exploreAPI, sessionsAPI, handleApiError } from '../../services/apiService';
import SessionBookingModal from '../sessions/SessionBookingModal';
import UserProfile from '../profile/UserProfile'; // Add this import
import '../../assets/styles/explore.css';

const ExploreFreePlan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [skillSwaps, setSkillSwaps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  // Booking modal state
  const [selectedSkillSwap, setSelectedSkillSwap] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // User profile modal state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory || currentPage > 0) {
      loadSkillSwaps();
    }
  }, [selectedCategory, currentPage]);

  // Add function to open user profile modal
  const openUserProfile = (userId) => {
    console.log('Opening user profile for userId:', userId);
    setSelectedUserId(userId);
    setUserProfileModalOpen(true);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, popularSkillsData] = await Promise.all([
        exploreAPI.getCategories().catch(() => []),
        exploreAPI.getPopularSkills(8).catch(() => [])
      ]);

      const processedCategories = [
        { id: 'all', name: 'All Categories', icon: '📚' },
        { id: 'programming', name: 'Programming', icon: '💻' },
        { id: 'design', name: 'Design', icon: '🎨' },
        { id: 'languages', name: 'Languages', icon: '🗣️' },
        { id: 'music', name: 'Music', icon: '🎵' },
        { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' }
      ];

      setCategories(processedCategories);
      setPopularSkills(Array.isArray(popularSkillsData) ? popularSkillsData : []);
      
      await loadSkillSwaps();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data from server');
      setSkillSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillSwaps = async (searchQuery = null, resetPage = true) => {
    try {
      setLoading(true);
      setError(null);

      const page = resetPage ? 0 : currentPage;
      
      const params = { page, size: 12 };
      if (searchQuery || searchTerm) params.search = searchQuery || searchTerm;
      if (selectedCategory && selectedCategory !== 'All Categories') params.category = selectedCategory;

      console.log('Loading skill swaps with params:', params);
      const response = await exploreAPI.getSkillSwaps(params);
      console.log('API Response:', response);

      let skillSwapsArray = [];
      if (response?.skillSwaps && Array.isArray(response.skillSwaps)) {
        skillSwapsArray = response.skillSwaps;
        setTotalPages(response.metadata?.totalPages || 1);
      } else if (Array.isArray(response)) {
        skillSwapsArray = response;
        setTotalPages(1);
      } else if (response?.content && Array.isArray(response.content)) {
        skillSwapsArray = response.content;
        setTotalPages(response.totalPages || 1);
      }

      // Fix data structure for booking - only if we have real data
      const normalizedSkillSwaps = skillSwapsArray.map(swap => {
        let teacherData = swap.teacher || {};
        if (!teacherData.displayName && teacherData.firstName) {
          teacherData.displayName = teacherData.firstName + ' ' + (teacherData.lastName || '');
        }
        
        return {
          ...swap,
          teacher: {
            id: teacherData.id || swap.teacherId,
            displayName: teacherData.displayName || teacherData.name || 'Teacher',
            firstName: teacherData.firstName,
            lastName: teacherData.lastName,
            profileImageUrl: teacherData.profileImageUrl,
            location: teacherData.location || 'Location not specified',
            rating: teacherData.rating || 4.5,
            reviewCount: teacherData.reviewCount || 0
          },
          skill: {
            id: swap.skill?.id || swap.skillId,
            name: swap.skill?.name || swap.title || 'Skill',
            category: swap.skill?.category || swap.category || 'General'
          }
        };
      });

      setSkillSwaps(normalizedSkillSwaps);
      if (resetPage) setCurrentPage(0);

    } catch (error) {
      console.error('Error loading skill swaps:', error);
      setSkillSwaps([]);
      setError('Failed to load skill swaps from server');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (bookingData) => {
    try {
      console.log('Booking session with data:', bookingData);
      
      if (!bookingData.teacherId || !bookingData.skillId) {
        throw new Error('Missing required booking information');
      }
      
      const result = await sessionsAPI.bookSession(bookingData);
      console.log('Session booked successfully:', result);
      
      setSuccessMessage('Session request sent! The teacher will respond within 48 hours.');
      setBookingModalOpen(false);
      setSelectedSkillSwap(null);
      
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Booking failed:', error);
      
      let errorMsg = 'Failed to book session. ';
      if (error.message.includes('401')) {
        errorMsg += 'Please log in first.';
      } else if (error.message.includes('400')) {
        errorMsg += 'Invalid session data.';
      } else if (error.message.includes('already have an active session')) {
        errorMsg += 'You already have a pending request with this teacher for this skill.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      alert(errorMsg);
    }
  };

  const openBookingModal = (skillSwap) => {
    console.log('Opening booking modal:', skillSwap);
    
    if (!skillSwap) {
      alert('Error: No session data available');
      return;
    }

    if (!skillSwap.teacher || !skillSwap.teacher.id) {
      console.error('Missing teacher data:', skillSwap.teacher);
      alert('Error: Teacher information is incomplete. Please try again.');
      return;
    }

    if (!skillSwap.skill || !skillSwap.skill.id) {
      console.error('Missing skill data:', skillSwap.skill);
      alert('Error: Skill information is incomplete. Please try again.');
      return;
    }
    
    setSelectedSkillSwap(skillSwap);
    setBookingModalOpen(true);
  };

  const renderSkillCard = (swap) => {
    if (!swap) return null;

    return (
      <div key={swap.id} className="skill-card">
        <div className="skill-header">
          <span className="skill-category">{swap.category || 'General'}</span>
          <span className={swap.isAvailable ? "skill-available" : "skill-unavailable"}>
            {swap.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        <h3 className="skill-title">{swap.title}</h3>
        <p className="skill-description">{swap.description}</p>
        
        <div className="tutor-info">
          <img 
            src={swap.teacher?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.teacher?.displayName || 'Teacher')}&background=4F46E5&color=fff`}
            alt={swap.teacher?.displayName || 'Teacher'} 
            className="tutor-avatar"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.teacher?.displayName || 'T')}&background=4F46E5&color=fff`;
            }}
          />
          <div className="tutor-details">
            <span 
              className="tutor-name clickable"
              onClick={() => openUserProfile(swap.teacher?.id)}
              style={{ cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}
            >
              {swap.teacher?.displayName || 'Teacher'}
            </span>
            <div className="tutor-rating">
              <span className="rating-star">⭐</span>
              <span>{swap.teacher?.rating || 4.5}</span>
              <span className="review-count">({swap.teacher?.reviewCount || 0} reviews)</span>
            </div>
          </div>
        </div>
        
        <div className="skill-footer">
          <div className="skill-meta">
            <span className="skill-free">Free Skill Swap</span>
            <span className="skill-duration">{swap.timeCommitment || '60 min'}</span>
          </div>
          <button 
            className="book-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openBookingModal(swap);
            }}
            disabled={!swap.isAvailable}
            style={{
              opacity: swap.isAvailable ? 1 : 0.6,
              cursor: swap.isAvailable ? 'pointer' : 'not-allowed'
            }}
          >
            {swap.isAvailable ? 'Book Session' : 'Unavailable'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Community Skills</h1>
        <p>Discover and connect with our community members for free skill swapping</p>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
          padding: '1rem', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0',
          borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>✅</span>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d', fontWeight: '500' }}>
              {successMessage}
            </p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '0.5rem', marginBottom: '1rem', color: '#dc2626'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search community skills..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              
              setTimeout(() => {
                if (value.length >= 2 || value.length === 0) {
                  loadSkillSwaps(value, true);
                }
              }, 300);
            }}
          />
        </div>
        <button 
          className="search-button" 
          onClick={() => loadSkillSwaps(searchTerm, true)}
        >
          Search
        </button>
      </div>
      
      {/* Popular Skills - Only show if we have real data */}
      {popularSkills.length > 0 && (
        <div className="popular-searches">
          <span className="popular-label">Popular:</span>
          {popularSkills.slice(0, 5).map((skill, index) => (
            <button 
              key={index} 
              className="popular-tag"
              onClick={() => {
                setSearchTerm(skill);
                loadSkillSwaps(skill, true);
              }}
            >
              {skill}
            </button>
          ))}
        </div>
      )}
      
      <div className="explore-content">
        {/* Categories */}
        <div className="categories-container">
          <h2>Categories</h2>
          <div className="categories-list">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(category.name);
                  setCurrentPage(0);
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Skills Grid */}
        <div className="skills-container">
          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div>Loading skill swaps...</div>
            </div>
          )}

          {/* Skills Grid - Only show real data */}
          {!loading && skillSwaps.length > 0 && (
            <div className="skills-grid">
              {skillSwaps.map(renderSkillCard)}
            </div>
          )}

          {/* No Results - More informative message */}
          {!loading && skillSwaps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <h3>No skills available</h3>
              <p>
                {searchTerm 
                  ? `No one is currently teaching "${searchTerm}". Try searching for different skills or check back later.`
                  : selectedCategory !== 'All Categories'
                  ? `No skills available in the "${selectedCategory}" category right now.`
                  : 'No skill swaps are currently available. Be the first to offer your skills to the community!'
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All Categories');
                    loadSkillSwaps('', true);
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear search and browse all
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSkillSwap && bookingModalOpen && (
        <SessionBookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedSkillSwap(null);
          }}
          teacher={selectedSkillSwap.teacher}
          skill={selectedSkillSwap.skill}
          onBookSession={handleBookSession}
        />
      )}

      {/* User Profile Modal */}
      <UserProfile
        userId={selectedUserId}
        isOpen={userProfileModalOpen}
        onClose={() => {
          setUserProfileModalOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
};

export default ExploreFreePlan;
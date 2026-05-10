// src/components/sessions/ExploreWithBooking.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { exploreAPI, sessionsAPI, handleApiError } from '../../services/apiService';
import SessionBookingModal from './SessionBookingModal';
import '../../assets/styles/explore.css';

const ExploreWithBooking = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Data from API
  const [skillSwaps, setSkillSwaps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Booking modal state
  const [selectedSkillSwap, setSelectedSkillSwap] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load skill swaps when filters change
  useEffect(() => {
    loadSkillSwaps();
  }, [selectedCategory, currentPage]);

  // Load initial data (categories, popular skills, initial skill swaps)
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load categories, popular skills, and initial skill swaps in parallel
      const [categoriesData, popularSkillsData] = await Promise.all([
        exploreAPI.getCategories().catch(err => {
          console.warn('Failed to load categories:', err);
          return [];
        }),
        exploreAPI.getPopularSkills(8).catch(err => {
          console.warn('Failed to load popular skills:', err);
          return [];
        })
      ]);

      // Process categories with accurate counts
      const processedCategories = [
        { id: 'all', name: 'All Categories', icon: '📚', skillCount: 0 },
        ...categoriesData.map(cat => ({
          id: cat.category.toLowerCase(),
          name: cat.category,
          icon: getCategoryIcon(cat.category),
          skillCount: cat.skillCount || 0
        }))
      ];

      setCategories(processedCategories);
      setPopularSkills(popularSkillsData);
      
      // Load initial skill swaps
      await loadSkillSwaps();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError(handleApiError(error, 'loading initial data'));
    } finally {
      setLoading(false);
    }
  };

  // Load skill swaps based on current filters
  const loadSkillSwaps = async (searchQuery = null, resetPage = true) => {
    try {
      setLoading(true);
      setError(null);

      const page = resetPage ? 0 : currentPage;
      
      const params = {
        page: page,
        size: 12
      };

      // Add search parameters
      if (searchQuery || searchTerm) {
        params.search = searchQuery || searchTerm;
      }

      // Add category filter (but not for "All Categories")
      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.category = selectedCategory;
      }

      console.log('Loading skill swaps with params:', params);
      
      const response = await exploreAPI.getSkillSwaps(params);
      
      console.log('API Response:', response);

      if (response && response.skillSwaps) {
        setSkillSwaps(response.skillSwaps);
        setSearchMetadata(response.metadata);
        setTotalPages(response.metadata?.totalPages || 0);
        
        if (resetPage) {
          setCurrentPage(0);
        }
      } else {
        console.warn('Unexpected response structure:', response);
        setSkillSwaps([]);
        setSearchMetadata(null);
      }

    } catch (error) {
      console.error('Error loading skill swaps:', error);
      setError(handleApiError(error, 'loading skill swaps'));
      setSkillSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debouncing
  const handleSearch = useCallback((query) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      loadSkillSwaps(query, true);
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      handleSearch(value);
      getSuggestions(value);
    } else if (value.length === 0) {
      loadSkillSwaps('', true);
      setShowSuggestions(false);
    }
  };

  // Get skill suggestions for autocomplete
  const getSuggestions = async (query) => {
    try {
      const suggestionsData = await exploreAPI.getSkillSuggestions(query, 5);
      
      const filteredSuggestions = suggestionsData.filter(suggestion => 
        suggestion.name.toLowerCase() !== query.toLowerCase() &&
        suggestion.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.warn('Failed to get suggestions:', error);
      setShowSuggestions(false);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      loadSkillSwaps(searchTerm.trim(), true);
      setShowSuggestions(false);
    }
  };

  // Handle popular skill click
  const handlePopularSkillClick = (skill) => {
    setSearchTerm(skill);
    loadSkillSwaps(skill, true);
    setShowSuggestions(false);
  };

  // Handle category selection
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setCurrentPage(0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
    loadSkillSwaps(suggestion.name, true);
    setShowSuggestions(false);
  };

  // Handle session booking
  const handleBookSession = async (bookingData) => {
    try {
      console.log('Booking session with data:', bookingData);
      
      // Call the sessions API
      const result = await sessionsAPI.bookSession(bookingData);
      
      setSuccessMessage('Session request sent successfully! The teacher will respond within 48 hours.');
      setBookingModalOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Failed to book session:', error);
      throw error;
    }
  };

  const openBookingModal = (skillSwap) => {
    setSelectedSkillSwap(skillSwap);
    setBookingModalOpen(true);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Programming': '💻',
      'Design': '🎨',
      'Languages': '🗣️',
      'Music': '🎵',
      'Business': '💼',
      'Fitness': '💪',
      'Cooking': '👨‍🍳',
      'Photography': '📸',
      'Writing': '✍️'
    };
    return icons[category] || '📚';
  };

  // Render skill swap card
  const renderSkillCard = (swap) => (
    <div key={swap.id} className="skill-card">
      <div className="skill-header">
        <span className="skill-category">{swap.category}</span>
        {swap.isAvailable ? (
          <span className="skill-available">Available</span>
        ) : (
          <span className="skill-unavailable">Unavailable</span>
        )}
      </div>
      
      <h3 className="skill-title">{swap.title}</h3>
      <p className="skill-description">{swap.description}</p>
      
      <div className="tutor-info">
        <img 
          src={swap.teacher.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.teacher.displayName)}&background=4F46E5&color=fff`} 
          alt={swap.teacher.displayName} 
          className="tutor-avatar"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.teacher.displayName)}&background=4F46E5&color=fff`;
          }}
        />
        <div className="tutor-details">
          <span className="tutor-name">{swap.teacher.displayName}</span>
          <div className="tutor-rating">
            <span className="rating-star">⭐</span>
            <span>{swap.teacher.rating || 4.5}</span>
            <span className="review-count">({swap.teacher.reviewCount || 0} reviews)</span>
          </div>
        </div>
      </div>
      
      <div className="skill-footer">
        <div className="skill-meta">
          <span className="skill-free">Free Skill Swap</span>
          <span className="skill-duration">{swap.timeCommitment}</span>
        </div>
        <button className="book-button" onClick={() => openBookingModal(swap)}>
          Book Session
        </button>
      </div>
    </div>
  );

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Community Skills</h1>
        <p>Discover and connect with our community members for free skill swapping</p>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <div className="success-content">
            <div className="success-icon">✓</div>
            <div>
              <p className="success-text">{successMessage}</p>
            </div>
          </div>
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
            onChange={handleSearchChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-name">{suggestion.name}</span>
                  <span className="suggestion-category">{suggestion.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="search-button" onClick={handleSearchClick}>
          Search
        </button>
      </div>
      
      {/* Popular searches */}
      <div className="popular-searches">
        <span className="popular-label">Popular:</span>
        {popularSkills
          .filter(skill => 
            skill.toLowerCase() !== searchTerm.toLowerCase() && 
            !skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
          .map((skill, index) => (
            <button 
              key={index} 
              className="popular-tag"
              onClick={() => handlePopularSkillClick(skill)}
            >
              {skill}
            </button>
          ))}
      </div>
      
      <div className="explore-content">
        {/* Categories */}
        <div className="categories-container">
          <h2>Categories</h2>
          <div className="categories-list">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => handleCategorySelect(category.name)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Skills Grid */}
        <div className="skills-container">
          {/* Search feedback message */}
          {searchMetadata?.message && (
            <div className={`search-message ${searchMetadata.hasTeachers ? 'success' : 'info'}`}>
              {searchMetadata.message}
              
              {/* Suggested skills */}
              {searchMetadata.suggestedSkills && searchMetadata.suggestedSkills.length > 0 && (
                <div className="suggested-skills">
                  {searchMetadata.suggestedSkills.map((suggestedSkill, index) => (
                    <button
                      key={index}
                      className="suggested-skill-button"
                      onClick={() => handlePopularSkillClick(suggestedSkill)}
                    >
                      {suggestedSkill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner">
                <div className="spinner-border"></div>
              </div>
              <p>Loading skill swaps...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="error-state">
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button onClick={() => loadSkillSwaps()} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {/* Skills grid */}
          {!loading && !error && skillSwaps.length > 0 && (
            <div className="skills-grid">
              {skillSwaps.map(renderSkillCard)}
            </div>
          )}

          {/* No results */}
          {!loading && !error && skillSwaps.length === 0 && (
            <div className="no-results">
              <h3>No skills found</h3>
              <p>
                {searchTerm 
                  ? `No results found for "${searchTerm}". Try different keywords or browse categories.`
                  : 'No skill swaps available at the moment. Check back later!'
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    loadSkillSwaps('', true);
                  }}
                  className="clear-search-button"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && skillSwaps.length > 0 && totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="pagination-button"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session Booking Modal */}
      <SessionBookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedSkillSwap(null);
        }}
        teacher={selectedSkillSwap?.teacher}
        skill={selectedSkillSwap?.skill}
        onBookSession={handleBookSession}
      />
    </div>
  );
};

export default ExploreWithBooking;

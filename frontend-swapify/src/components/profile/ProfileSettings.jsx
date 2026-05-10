// components/profile/ProfileSettings.jsx (Updated - Timezone Removed)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/ProfileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Skills and Learning Goals state
  const [skillsKnown, setSkillsKnown] = useState([]);
  const [learningGoals, setLearningGoals] = useState([]);
  const [newSkillKnown, setNewSkillKnown] = useState({ category: '', name: '', level: '' });
  const [newLearningGoal, setNewLearningGoal] = useState({ category: '', name: '', priority: '' });
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    phone: '',
    dateOfBirth: '',
    experienceLevel: '',
    preferredLearningStyle: '',
    skills: '',
    interests: '',
    // timezone: '', // REMOVED
    availability: '',
    hourlyRate: '',
    isLookingToLearn: false,
    isAvailableForTeaching: false,
    website: '',
    linkedinUrl: '',
    githubUrl: '',
    profileImageUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchSkillsAndGoals(); // Fetch existing skills and goals
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('http://localhost:8081/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PROFILE DATA FROM BACKEND:', data);
        console.log('🖼️ PROFILE IMAGE URL:', data.profileImageUrl);
        
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          experienceLevel: data.experienceLevel || '',
          preferredLearningStyle: data.preferredLearningStyle || '',
          skills: data.skills || '',
          interests: data.interests || '',
          // timezone: data.timezone || '', // REMOVED
          availability: data.availability || '',
          hourlyRate: data.hourlyRate || '',
          isLookingToLearn: data.isLookingToLearn || false,
          isAvailableForTeaching: data.isAvailableForTeaching || false,
          website: data.website || '',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          profileImageUrl: data.profileImageUrl || ''
        });
        setImagePreview(data.profileImageUrl || null);
        console.log('📸 SET IMAGE PREVIEW TO:', data.profileImageUrl || null);
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
        setErrors({ general: 'Failed to load profile data' });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setErrors({ general: 'Network error: Could not connect to server' });
    }
  };

  // Fetch existing skills and goals from the backend
  const fetchSkillsAndGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch user skills
      const skillsResponse = await fetch('http://localhost:8081/api/skills/my-skills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        console.log('📚 FETCHED SKILLS:', skillsData);
        
        // Convert backend format to local state format
        const formattedSkills = skillsData.map(userSkill => ({
          id: userSkill.id,
          name: userSkill.skill.name,
          category: userSkill.skill.category,
          level: userSkill.level
        }));
        setSkillsKnown(formattedSkills);
      }

      // Fetch learning goals
      const goalsResponse = await fetch('http://localhost:8081/api/skills/my-goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        console.log('🎯 FETCHED GOALS:', goalsData);
        
        // Convert backend format to local state format
        const formattedGoals = goalsData.map(userGoal => ({
          id: userGoal.id,
          name: userGoal.skill.name,
          category: userGoal.skill.category,
          priority: userGoal.priority
        }));
        setLearningGoals(formattedGoals);
      }
    } catch (error) {
      console.error('Failed to fetch skills and goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Simple frontend validation (for UX only)
  const validateSkillInput = (input) => {
    const cleanInput = input.trim().toLowerCase();
    
    // Check if empty
    if (!cleanInput) {
      return { isValid: false, message: 'Skill name cannot be empty.' };
    }
    
    // Must be at least 2 characters
    if (cleanInput.length < 2) {
      return { isValid: false, message: 'Skill name must be at least 2 characters.' };
    }
    
    // Cannot be only numbers
    if (/^\d+$/.test(cleanInput)) {
      return { isValid: false, message: 'Skill name cannot be only numbers.' };
    }
    
    // Cannot have more than 4 consecutive identical characters
    if (/(.)\1{4,}/.test(cleanInput)) {
      return { isValid: false, message: 'Please enter a valid skill name.' };
    }
    
    // Check for inappropriate words
    const inappropriateWords = [
      'drugs', 'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis', 'meth',
      'sex', 'porn', 'nude', 'naked', 'adult', 'xxx', 'fuck', 'fucking',
      'hate', 'kill', 'murder', 'death', 'suicide', 'nazi', 'terrorist',
      'shit', 'damn', 'hell', 'bitch', 'ass', 'bastard', 'crap',
      'scam', 'fraud', 'steal', 'theft', 'illegal', 'hack', 'hacking',
      'bomb', 'weapon', 'gun', 'violence', 'rape', 'abuse'
    ];
    
    if (inappropriateWords.some(word => cleanInput.includes(word))) {
      return { isValid: false, message: 'Please use appropriate language.' };
    }
    
    // Must contain at least one vowel (basic language check)
    if (!/[aeiou]/i.test(cleanInput)) {
      return { isValid: false, message: 'Please enter a valid skill name.' };
    }
    
    return { isValid: true };
  };

  // Save skill to backend
  const addSkillKnown = async () => {
    if (newSkillKnown.category && newSkillKnown.name && newSkillKnown.level) {
      // Frontend validation for immediate feedback
      const validation = validateSkillInput(newSkillKnown.name);
      if (!validation.isValid) {
        setErrors({ skills: validation.message });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8081/api/skills/add-skill', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            skillName: newSkillKnown.name.trim(),
            category: newSkillKnown.category,
            level: newSkillKnown.level
          })
        });

        if (response.ok) {
          const savedSkill = await response.json();
          console.log('✅ SKILL SAVED:', savedSkill);
          
          // Add to local state
          const formattedSkill = {
            id: savedSkill.id,
            name: savedSkill.skill.name,
            category: savedSkill.skill.category,
            level: savedSkill.level
          };
          setSkillsKnown([...skillsKnown, formattedSkill]);
          setNewSkillKnown({ category: '', name: '', level: '' });
          setSuccess('Skill added successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const errorData = await response.json();
          setErrors({ skills: errorData.message || 'Failed to add skill' });
        }
      } catch (error) {
        console.error('Failed to add skill:', error);
        setErrors({ skills: 'Failed to add skill' });
      }
    }
  };

  // Remove skill from backend
  const removeSkillKnown = async (index) => {
    const skillToRemove = skillsKnown[index];
    if (!skillToRemove.id) {
      // If no ID, just remove from local state (shouldn't happen with backend skills)
      setSkillsKnown(skillsKnown.filter((_, i) => i !== index));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/skills/skills/${skillToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ SKILL REMOVED');
        setSkillsKnown(skillsKnown.filter((_, i) => i !== index));
        setSuccess('Skill removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setErrors({ skills: 'Failed to remove skill' });
      }
    } catch (error) {
      console.error('Failed to remove skill:', error);
      setErrors({ skills: 'Failed to remove skill' });
    }
  };

  // Save learning goal to backend
  const addLearningGoal = async () => {
    if (newLearningGoal.category && newLearningGoal.name && newLearningGoal.priority) {
      // Frontend validation for immediate feedback
      const validation = validateSkillInput(newLearningGoal.name);
      if (!validation.isValid) {
        setErrors({ goals: validation.message });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8081/api/skills/add-goal', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            skillName: newLearningGoal.name.trim(),
            category: newLearningGoal.category,
            priority: newLearningGoal.priority
          })
        });

        if (response.ok) {
          const savedGoal = await response.json();
          console.log('✅ GOAL SAVED:', savedGoal);
          
          // Add to local state
          const formattedGoal = {
            id: savedGoal.id,
            name: savedGoal.skill.name,
            category: savedGoal.skill.category,
            priority: savedGoal.priority
          };
          setLearningGoals([...learningGoals, formattedGoal]);
          setNewLearningGoal({ category: '', name: '', priority: '' });
          setSuccess('Learning goal added successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const errorData = await response.json();
          setErrors({ goals: errorData.message || 'Failed to add learning goal' });
        }
      } catch (error) {
        console.error('Failed to add learning goal:', error);
        setErrors({ goals: 'Failed to add learning goal' });
      }
    }
  };

  // Remove learning goal from backend
  const removeLearningGoal = async (index) => {
    const goalToRemove = learningGoals[index];
    if (!goalToRemove.id) {
      // If no ID, just remove from local state (shouldn't happen with backend goals)
      setLearningGoals(learningGoals.filter((_, i) => i !== index));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/skills/goals/${goalToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ GOAL REMOVED');
        setLearningGoals(learningGoals.filter((_, i) => i !== index));
        setSuccess('Learning goal removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setErrors({ goals: 'Failed to remove learning goal' });
      }
    } catch (error) {
      console.error('Failed to remove learning goal:', error);
      setErrors({ goals: 'Failed to remove learning goal' });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profileImage: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'Image must be less than 5MB' }));
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setErrors(prev => ({ ...prev, profileImage: '' }));
    }
  };

  const uploadProfileImage = async () => {
    if (!selectedFile) return profile.profileImageUrl;
    
    console.log('📸 Starting image upload...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image uploaded successfully:', data.imageUrl);
        return data.imageUrl;
      } else {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error('Image upload failed');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image: ' + error.message }));
      return profile.profileImageUrl;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (profile.firstName && profile.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (profile.lastName && profile.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (profile.bio && profile.bio.length > 1000) {
      newErrors.bio = 'Bio cannot exceed 1000 characters';
    }
    if (profile.hourlyRate && (isNaN(profile.hourlyRate) || profile.hourlyRate < 0)) {
      newErrors.hourlyRate = 'Hourly rate must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setErrors({});
    setSuccess('');

    try {
      // Upload image first if there's a new one
      const imageUrl = await uploadProfileImage();
      console.log('🖼️ IMAGE URL TO SAVE:', imageUrl);
      console.log('🖼️ IMAGE URL LENGTH:', imageUrl ? imageUrl.length : 0);
      
      const profileToSave = {
        ...profile,
        profileImageUrl: imageUrl,
        hourlyRate: profile.hourlyRate ? parseFloat(profile.hourlyRate) : null
      };
      
      console.log('💾 SAVING PROFILE (profileImageUrl only):', profileToSave.profileImageUrl);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/profile/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileToSave)
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('✅ SAVED PROFILE RESPONSE (imageUrl only):', savedData.profileImageUrl);
        setSuccess('Profile updated successfully!');
        setSelectedFile(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ SAVE ERROR:', errorData);
        setErrors({ general: errorData.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('❌ NETWORK ERROR:', error);
      setErrors({ general: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-settings-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'professional', label: 'Professional', icon: '💼' },
    { id: 'skills', label: 'Skills & Goals', icon: '🎯' },
    { id: 'social', label: 'Social Links', icon: '🔗' }
  ];

  return (
    <div className="profile-settings-container">
      <div className="profile-settings-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Profile Settings</h1>
        <p>Manage your profile information and preferences</p>
      </div>

      {errors.general && (
        <div className="alert alert-error">{errors.general}</div>
      )}
      
      {success && (
        <div className="alert alert-success">{success}</div>
      )}

      <div className="profile-settings-content">
        {/* Tab Navigation */}
        <div className="tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'personal' && (
            <div className="form-section">
              <h2>Personal Information</h2>
              
              {/* Profile Photo Upload */}
              <div className="form-group">
                <label>Profile Photo</label>
                <div className="file-upload-container">
                  <div className="file-upload-preview">
                    {imagePreview ? (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Profile preview" className="current-image" />
                        <button 
                          type="button" 
                          className="remove-image-button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedFile(null);
                            setProfile(prev => ({ ...prev, profileImageUrl: '' }));
                          }}
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="no-image-placeholder">
                        <div className="placeholder-icon">👤</div>
                        <span>No profile photo</span>
                      </div>
                    )}
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="profileImage"
                        className="file-input"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="profileImage" className="file-input-button">
                        📷 {imagePreview ? 'Change Photo' : 'Choose Photo'}
                      </label>
                    </div>
                  </div>
                  {errors.profileImage && <span className="error-text">{errors.profileImage}</span>}
                  <small>Upload a photo (max 5MB). Supported formats: JPG, PNG, GIF</small>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                  className={errors.bio ? 'error' : ''}
                />
                <small>{profile.bio.length}/1000 characters</small>
                {errors.bio && <span className="error-text">{errors.bio}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profile.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="form-section">
              <h2>Professional Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={profile.experienceLevel}
                    onChange={handleInputChange}
                  >
                    <option value="">Select level</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>
                
                
              </div>

              <div className="form-group">
                <label>Skills</label>
                <textarea
                  name="skills"
                  value={profile.skills}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="JavaScript, React, Node.js, Python..."
                />
                <small>Separate skills with commas</small>
              </div>

              <div className="form-group">
                <label>Interests</label>
                <textarea
                  name="interests"
                  value={profile.interests}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Machine Learning, Web Design, Photography..."
                />
                <small>What would you like to learn?</small>
              </div>

              <div className="form-group">
                <label>Availability</label>
                <select
                  name="availability"
                  value={profile.availability}
                  onChange={handleInputChange}
                >
                  <option value="">Select availability</option>
                  <option value="WEEKDAYS">Weekdays</option>
                  <option value="WEEKENDS">Weekends</option>
                  <option value="EVENINGS">Evenings</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isLookingToLearn"
                    checked={profile.isLookingToLearn}
                    onChange={handleInputChange}
                  />
                  <span>I'm looking to learn new skills</span>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailableForTeaching"
                    checked={profile.isAvailableForTeaching}
                    onChange={handleInputChange}
                  />
                  <span>I'm available to teach others</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="skills-goals-container">
              
              
              {/* Display any errors for skills */}
              {errors.skills && (
                <div className="modern-alert error">{errors.skills}</div>
              )}
              {errors.goals && (
                <div className="modern-alert error">{errors.goals}</div>
              )}
              
              {/* Two Column Layout */}
              <div className="skills-layout">
                {/* Left Column - Skills I Can Teach */}
                <div className="skills-column teach-column">
                  <div className="column-header">
                  
                    <div className="header-content">
                      <h3>Skills I Can Teach</h3>
                      <p>Share your expertise with the community</p>
                    </div>
                  </div>
                  
                  <div className="add-skill-card">
                    <div className="card-title">Add New Teaching Skill</div>
                    <div className="modern-form-grid">
                      <div className="form-field">
                        <select 
                          value={newSkillKnown.category}
                          onChange={(e) => setNewSkillKnown({...newSkillKnown, category: e.target.value})}
                          className="modern-select"
                        >
                          <option value="">📂 Category</option>
                          <option value="Programming">💻 Programming</option>
                          <option value="Design">🎨 Design</option>
                          <option value="Languages">🗣️ Languages</option>
                          <option value="Music">🎵 Music</option>
                          <option value="Business">📊 Business</option>
                          <option value="Fitness">💪 Fitness</option>
                          <option value="Cooking">🍳 Cooking</option>
                          <option value="Photography">📸 Photography</option>
                        </select>
                      </div>
                      
                      <div className="form-field">
                        <input
                          type="text"
                          placeholder=" Skill name (e.g., JavaScript, Guitar)"
                          value={newSkillKnown.name}
                          onChange={(e) => setNewSkillKnown({...newSkillKnown, name: e.target.value})}
                          className="modern-input"
                        />
                      </div>
                      
                      <div className="form-field">
                        <select
                          value={newSkillKnown.level}
                          onChange={(e) => setNewSkillKnown({...newSkillKnown, level: e.target.value})}
                          className="modern-select"
                        >
                          <option value="">🎚️ Level</option>
                          <option value="BEGINNER"> Beginner</option>
                          <option value="INTERMEDIATE"> Intermediate</option>
                          <option value="ADVANCED"> Advanced</option>
                          <option value="EXPERT"> Expert</option>
                        </select>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={addSkillKnown}
                        className="modern-add-btn teach-btn"
                        disabled={!newSkillKnown.category || !newSkillKnown.name || !newSkillKnown.level}
                      ><span>Add Skill</span></button>
                        
                    </div>
                  </div>
                  
                  {/* Skills List */}
                  <div className="skills-grid">
                    {skillsKnown.map((skill, index) => (
                      <div key={skill.id || index} className="modern-skill-card teach-card">
                        <div className="skill-header">
                          <div className="skill-level">{skill.level}</div>
                        </div>
                        <div className="skill-name">{skill.name}</div>
                        <div className="skill-category">{skill.category}</div>
                        <button 
                          onClick={() => removeSkillKnown(index)}
                          className="modern-remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {skillsKnown.length === 0 && (
                      <div className="empty-state-card">
                        <div className="empty-icon">🌟</div>
                        <div className="empty-title">No teaching skills yet</div>
                        <div className="empty-text">Add skills you can share with others</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Skills I Want to Learn */}
                <div className="skills-column learn-column">
                  <div className="column-header">
                   
                    <div className="header-content">
                      <h3>Skills I Want to Learn</h3>
                      <p>Set goals and find mentors in the community</p>
                    </div>
                  </div>
                  
                  <div className="add-skill-card">
                    <div className="card-title">Add New Learning Goal</div>
                    <div className="modern-form-grid">
                      <div className="form-field">
                        <select 
                          value={newLearningGoal.category}
                          onChange={(e) => setNewLearningGoal({...newLearningGoal, category: e.target.value})}
                          className="modern-select"
                        >
                          <option value="">📂 Category</option>
                          <option value="Programming">💻 Programming</option>
                          <option value="Design">🎨 Design</option>
                          <option value="Languages">🗣️ Languages</option>
                          <option value="Music">🎵 Music</option>
                          <option value="Business">📊 Business</option>
                          <option value="Fitness">💪 Fitness</option>
                          <option value="Cooking">🍳 Cooking</option>
                          <option value="Photography">📸 Photography</option>
                        </select>
                      </div>
                      
                      <div className="form-field">
                        <input
                          type="text"
                          placeholder=" What do you want to learn?"
                          value={newLearningGoal.name}
                          onChange={(e) => setNewLearningGoal({...newLearningGoal, name: e.target.value})}
                          className="modern-input"
                        />
                      </div>
                      
                      <div className="form-field">
                        <select
                          value={newLearningGoal.priority}
                          onChange={(e) => setNewLearningGoal({...newLearningGoal, priority: e.target.value})}
                          className="modern-select"
                        >
                          <option value="">⚡ Priority</option>
                          <option value="HIGH">🔥 High Priority</option>
                          <option value="MEDIUM">⭐ Medium Priority</option>
                          <option value="LOW">💫 Low Priority</option>
                        </select>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={addLearningGoal}
                        className="modern-add-btn learn-btn"
                        disabled={!newLearningGoal.category || !newLearningGoal.name || !newLearningGoal.priority}
                      >
                        <span>Add Goal</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Learning Goals List */}
                  <div className="skills-grid">
                    {learningGoals.map((goal, index) => (
                      <div key={goal.id || index} className="modern-skill-card learn-card">
                        <div className="skill-header">
                          <div className={`skill-priority ${goal.priority.toLowerCase()}`}>
                          </div>
                        </div>
                        <div className="skill-name">{goal.name}</div>
                        <div className="skill-category">{goal.category}</div>
                        <button 
                          onClick={() => removeLearningGoal(index)}
                          className="modern-remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {learningGoals.length === 0 && (
                      <div className="empty-state-card">
                        <div className="empty-icon">🎯</div>
                        <div className="empty-title">No learning goals yet</div>
                        <div className="empty-text">Add skills you want to learn</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="form-section">
              <h2>Social Links</h2>
              
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={profile.linkedinUrl}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="form-group">
                <label>GitHub Profile</label>
                <input
                  type="url"
                  name="githubUrl"
                  value={profile.githubUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="social-preview">
                <h3>Preview</h3>
                <div className="social-links-preview">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                      🌐 Website
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                      💼 LinkedIn
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                      🐙 GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="form-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
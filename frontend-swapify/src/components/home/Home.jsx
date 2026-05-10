import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/home.css';

const Home = () => {
  const categories = [
    { id: 1, name: 'Programming', icon: '💻', count: '1.2k skills' },
    { id: 2, name: 'Languages', icon: '🗣️', count: '890 skills' },
    { id: 3, name: 'Design', icon: '🎨', count: '750 skills' },
    { id: 4, name: 'Music', icon: '🎵', count: '620 skills' },
    { id: 5, name: 'Cooking', icon: '🍳', count: '540 skills' },
  ];

 
  return (
    <div className="home">
      {/* Accessibility: Skip to main content link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Hero Section - Updated with clearer value proposition */}
      <section className="hero" id="main-content">
        <div className="hero-content">
          <h1>Learn Anything, Teach What You Love</h1>
          <p>Join our global community where you can swap skills with peers or learn from experts with our Pro plan.</p>
          
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">Get Started Free</Link>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="hero-image-container">
            <div className="hero-illustration">
              {/* Static illustration showing people learning */}
              <img 
                src="/src/assets/images/learning-illustration.png" 
                alt="People learning together online"
                onError={(e) => {
                  // Fallback to SVG if image doesn't load
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `
                    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#5f90c9" rx="20" ry="20" />
                      
                      <!-- Learning devices -->
                      <rect x="120" y="100" width="260" height="160" rx="10" fill="#ffffff" />
                      <rect x="140" y="120" width="220" height="120" rx="5" fill="#eef2f7" />
                      
                      <!-- People icons -->
                      <circle cx="180" cy="260" r="30" fill="#ffffff" />
                      <circle cx="250" cy="260" r="30" fill="#ffffff" />
                      <circle cx="320" cy="260" r="30" fill="#ffffff" />
                      
                      <!-- Simplified faces -->
                      <circle cx="180" cy="250" r="20" fill="#ffb142" />
                      <circle cx="250" cy="250" r="20" fill="#ff6b6b" />
                      <circle cx="320" cy="250" r="20" fill="#5ac8fa" />
                      
                      <!-- Connection lines -->
                      <line x1="180" y1="220" x2="180" y2="180" stroke="#ffffff" stroke-width="3" />
                      <line x1="250" y1="220" x2="250" y2="180" stroke="#ffffff" stroke-width="3" />
                      <line x1="320" y1="220" x2="320" y2="180" stroke="#ffffff" stroke-width="3" />
                      
                      <!-- Knowledge symbols -->
                      <circle cx="180" cy="170" r="15" fill="#ffffff" />
                      <text x="180" y="175" font-size="18" text-anchor="middle" fill="#6563ff">🎓</text>
                      
                      <circle cx="250" cy="170" r="15" fill="#ffffff" />
                      <text x="250" y="175" font-size="18" text-anchor="middle" fill="#6563ff">🎨</text>
                      
                      <circle cx="320" cy="170" r="15" fill="#ffffff" />
                      <text x="320" y="175" font-size="18" text-anchor="middle" fill="#6563ff">💻</text>
                    </svg>
                  `;
                }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works - Updated to explain the skill-sharing concept */}
      <section className="how-it-works">
        <h2>How Swapify Works</h2>
        <p className="section-subtitle">Learning has never been more collaborative</p>
        
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon" aria-hidden="true">📝</div>
            <h3>Create Your Profile</h3>
            <p>Sign up and share what skills you want to learn and what skills you can teach others.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon" aria-hidden="true">🔄</div>
            <h3>Match & Connect</h3>
            <p>Get matched with community members for skill swapping or find professional teachers with Pro plan.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon" aria-hidden="true">🚀</div>
            <h3>Learn & Teach</h3>
            <p>Schedule sessions, connect via video, and track your progress as you exchange knowledge.</p>
          </div>
        </div>
      </section>
      
      {/* Featured Categories */}
      <section className="categories">
        <h2>Explore Skills</h2>
        <p className="section-subtitle">Browse courses in programming, design, music, and more</p>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div className="category-card" key={category.id}>
              <div className="category-icon" aria-hidden="true">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{category.count}</p>
              <Link to={`/category/${category.id}`} className="learn-more" aria-label={`Explore ${category.name} skills`}>
                Explore Skills
              </Link>
            </div>
          ))}
        </div>
      </section>
      
      {/* Skill Swap Showcase - New section */}
      <section className="skill-swap-showcase">
        <h2>Popular Skill Swaps</h2>
        <p className="section-subtitle">See how our community members are exchanging skills</p>
        
        <div className="swap-examples">
          <div className="swap-card">
            <div className="swap-illustration">
              <div className="swap-person">
                <div className="swap-avatar">👨‍💻</div>
                <div className="swap-skill">Web Development</div>
              </div>
              <div className="swap-arrows">
                <div className="swap-arrow">←</div>
                <div className="swap-arrow">→</div>
              </div>
              <div className="swap-person">
                <div className="swap-avatar">👩‍🎨</div>
                <div className="swap-skill">Graphic Design</div>
              </div>
            </div>
            <p className="swap-description">Alex teaches HTML/CSS to Maria while learning logo design</p>
          </div>
          
          <div className="swap-card">
            <div className="swap-illustration">
              <div className="swap-person">
                <div className="swap-avatar">🧘‍♀️</div>
                <div className="swap-skill">Yoga Instruction</div>
              </div>
              <div className="swap-arrows">
                <div className="swap-arrow">←</div>
                <div className="swap-arrow">→</div>
              </div>
              <div className="swap-person">
                <div className="swap-avatar">🎸</div>
                <div className="swap-skill">Guitar Lessons</div>
              </div>
            </div>
            <p className="swap-description">Sarah provides yoga sessions while learning guitar basics</p>
          </div>
          
          <div className="swap-card">
            <div className="swap-illustration">
              <div className="swap-person">
                <div className="swap-avatar">👨‍🍳</div>
                <div className="swap-skill">Italian Cooking</div>
              </div>
              <div className="swap-arrows">
                <div className="swap-arrow">←</div>
                <div className="swap-arrow">→</div>
              </div>
              <div className="swap-person">
                <div className="swap-avatar">🇯🇵</div>
                <div className="swap-skill">Japanese Language</div>
              </div>
            </div>
            <p className="swap-description">Marco teaches Italian cooking in exchange for Japanese lessons</p>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      
      
      <section className="join-cta">
        <div className="cta-decoration decoration-1"></div>
        <div className="cta-decoration decoration-2"></div>
        <div className="cta-decoration decoration-3"></div>
        
        <h2>Ready to Start Your Learning Journey?</h2>
        <p>Join our global community of learners and teachers today</p>
        <div className="cta-buttons-container">
          <Link to="/register" className="cta-button primary large">Start Free</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
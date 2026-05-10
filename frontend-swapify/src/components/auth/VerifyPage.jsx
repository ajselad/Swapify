import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerificationCodeInput from './VerificationCodeInput';
import '../../assets/styles/verificationpage.css';

const VerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const isLogin = location.state?.isLogin || false;

  const handleVerified = () => {
    if (!isLogin) {
      navigate('/login');
    }
    // For login, token handling is done inside VerificationCodeInput
  };

  if (!email) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <h1 className="verification-title">Enter Your Email</h1>
          <input
            type="email"
            className="code-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="verify-button"
            disabled={!email}
            onClick={() => {
              if (email) setEmail(email); // Just to force rerender for demo
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <VerificationCodeInput
      email={email}
      onVerified={handleVerified}
      isLogin={isLogin}
    />
  );
};

export default VerifyPage;

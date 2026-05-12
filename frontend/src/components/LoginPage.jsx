import React from 'react';
import { Sparkles, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">
            <Sparkles size={28} />
          </div>
          <h1 className="serif-heading">HR Agent Pro</h1>
          <p className="subtitle">Enterprise AI Shortlisting Platform</p>
        </div>

        <div className="login-content">
          <h2>Find your next top candidate.</h2>
          <p>Join hundreds of HR professionals using AI to eliminate bias and find perfect-fit candidates in seconds.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><Zap size={16} /></div>
              <span>Batch Resume Analysis</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={16} /></div>
              <span>Unbiased AI Scoring</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Globe size={16} /></div>
              <span>Global Talent Ingestion</span>
            </div>
          </div>

          <button className="btn btn-primary login-btn" onClick={onLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
            Continue with Google
          </button>
        </div>

        <div className="login-footer">
          <p>Secure. Private. Enterprise-Ready.</p>
        </div>
      </div>
      
      {/* Visual Background Elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
    </div>
  );
};

export default LoginPage;

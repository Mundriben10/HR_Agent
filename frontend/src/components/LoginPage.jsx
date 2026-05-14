import React from 'react';
import { LogIn, Shield, Zap, Database, CheckCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-page">
      <div className="login-blob-1"></div>
      <div className="login-blob-2"></div>
      
      <div className="login-card fade-up">
        <div className="login-header">
          <div className="login-logo">
            <Zap size={24} fill="currentColor" />
          </div>
          <h1 className="serif-heading">HR Agent AI</h1>
          <p>The Intelligent Shortlisting Engine</p>
        </div>

        <div className="login-features">
          <div className="login-feature-item">
            <CheckCircle size={18} className="text-emerald" />
            <span>Automated Resume Scoring</span>
          </div>
          <div className="login-feature-item">
            <CheckCircle size={18} className="text-emerald" />
            <span>Cloud History Persistence</span>
          </div>
          <div className="login-feature-item">
            <CheckCircle size={18} className="text-emerald" />
            <span>Human-in-the-Loop Auditing</span>
          </div>
        </div>

        <button className="btn btn-primary login-btn" onClick={onLogin}>
          <LogIn size={20} />
          Sign in with Google
        </button>

        <div className="login-footer">
          <Shield size={14} />
          <span>Secure Enterprise-Grade Data Isolation</span>
        </div>
      </div>

      <div className="login-stats stagger">
        <div className="login-stat-pill">
          <Database size={14} /> 1M+ Context Window
        </div>
        <div className="login-stat-pill">
          <Zap size={14} /> Sub-2s Latency
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

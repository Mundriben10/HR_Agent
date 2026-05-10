import React, { useState, useRef } from 'react';

const UploadSection = ({ onEvaluate, isLoading }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jdText && resumes && resumes.length > 0) {
      onEvaluate(jdText, resumes);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumes(e.target.files);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Configure Evaluation</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Input the target Job Description and upload candidate resumes.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="jd" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Job Description</label>
          <textarea 
            id="jd"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            required
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Candidate Profiles (PDF, DOCX, or JSON)</label>
          
          <div 
            onClick={() => fileInputRef.current.click()}
            style={{
              padding: '40px',
              border: '2px dashed rgba(255,255,255,0.1)',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              background: resumes ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx,.json"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              required
            />
            {resumes ? (
              <div>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>
                  {resumes.length} File{resumes.length !== 1 ? 's' : ''} Selected
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Click to replace files
                </p>
              </div>
            ) : (
              <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p style={{ color: 'var(--text-secondary)' }}>Drag & drop profiles (PDF, DOCX, JSON) here</p>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary"
          disabled={isLoading || !jdText || !resumes}
          style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Analyzing Candidates...
            </>
          ) : (
            'Run AI Evaluation'
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadSection;

import React, { useState, useRef } from 'react';

const UploadSection = ({ onEvaluate, isLoading, progress, completedFiles }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jdText && resumes) {
      onEvaluate(jdText, resumes);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setResumes(e.dataTransfer.files);
    }
  };

  if (isLoading && progress) {
    const totalProgress = (progress.current / progress.total) * 100;
    return (
      <div className="animate-fade-up" style={{ textAlign: 'center', padding: '60px 0', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Analyzing Talent
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '12px' }}>
            Our agents are evaluating resumes against your criteria.
          </p>
        </div>

        <div className="glass-strong" style={{ padding: '40px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>{progress.filename || 'Initializing...'}</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          
          <div style={{ 
            height: '10px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', width: `${totalProgress}%`, background: 'var(--accent)', borderRadius: '100px', 
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {completedFiles.map((name, i) => (
              <div key={i} className="animate-fade-up" style={{ 
                padding: '6px 12px', borderRadius: '8px', background: 'var(--success-bg)', color: 'var(--success)', 
                fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(16,185,129,0.1)' 
              }}>
                ✓ {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
          Smart Talent<br /><span style={{ color: 'var(--accent)' }}>Shortlisting</span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', marginTop: '16px' }}>
          Analyze candidate resumes against job descriptions with multi-dimensional AI scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left: JD */}
        <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>1</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Job Description</h3>
          </div>
          <textarea
            className="input-field"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste your job description requirements here..."
            required
            rows={12}
            style={{ flex: 1, resize: 'none', background: '#fafafa' }}
          />
        </div>

        {/* Right: Files */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>2</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Resumes</h3>
            </div>
            
            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                flex: 1,
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'var(--accent-bg)' : '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                padding: '32px'
              }}
            >
              <input
                type="file" multiple accept=".pdf,.docx,.json"
                ref={fileInputRef}
                onChange={(e) => e.target.files.length > 0 && setResumes(e.target.files)}
                style={{ display: 'none' }}
                required
              />
              {resumes ? (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
                  <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.125rem' }}>
                    {resumes.length} Files Selected
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Ready for neural analysis
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>📤</div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem' }}>
                    Upload Candidate Resumes
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Drag & drop or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>browse files</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            disabled={isLoading || !jdText || !resumes}
            style={{ width: '100%', padding: '20px', fontSize: '1.125rem', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 102, 255, 0.2)' }}
          >
            Start Intelligence Loop
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadSection;

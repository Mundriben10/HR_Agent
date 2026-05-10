import React, { useState, useRef } from 'react';

const UploadSection = ({ onEvaluate, isLoading, progress, completedFiles }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jdText && resumes) onEvaluate(jdText, resumes);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) setResumes(e.dataTransfer.files);
  };

  /* ── Loading / Progress State ── */
  if (isLoading && progress) {
    const pct = (progress.current / progress.total) * 100;
    return (
      <div className="animate-fade-up" style={{ maxWidth: '560px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '36px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: 'var(--shadow-brand)' }}>
            <span style={{ fontSize: '1.75rem' }}>🔍</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Analyzing Resumes
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
            Our AI agents are scoring each candidate across 5 dimensions.
          </p>
        </div>

        <div className="glass" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
              maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {progress.filename || 'Initializing agents...'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand)',
              fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(pct)}%
            </span>
          </div>

          <div className="progress-track" style={{ height: '10px', marginBottom: '24px' }}>
            <div className="progress-fill" style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--brand-light), var(--brand-dark))',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {completedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {completedFiles.map((name, i) => (
                <div key={i} className="animate-fade-in" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '20px',
                  background: 'var(--success-bg)', color: 'var(--success)',
                  fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ {name}
                </div>
              ))}
            </div>
          )}

          {progress.step === 'all_done' && (
            <div className="animate-fade-in" style={{ marginTop: '20px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
              <span>✅</span> All candidates evaluated. Loading results...
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Upload Form ── */
  const canSubmit = !isLoading && jdText.trim() && resumes;

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

      {/* ── Hero Header ── */}
      <div className="animate-fade-up" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)' }}>
            <span style={{ fontSize: '1.4rem' }}>🧠</span>
          </div>
          <div>
            <div className="section-label">AI-Powered Evaluation</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Smart Talent Shortlisting
            </h1>
          </div>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.65 }}>
          Paste your job description, upload candidate resumes, and get instant ranked shortlists with
          multi-dimensional AI scoring across skills, experience, education, portfolio, and communication.
        </p>
      </div>

      {/* ── Feature Pills ── */}
      <div className="animate-fade-up" style={{ display: 'flex', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
        {['🎯 5-Dimension Scoring', '⚡ Real-time Analysis', '📊 Ranked Shortlist', '✏️ HR Override Support'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-xs)' }}>
            {f}
          </div>
        ))}
      </div>

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── Left: Job Description ── */}
        <div className="glass stagger" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--brand-subtle)',
              color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.8rem' }}>01</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Job Description</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Paste the full job description — the AI will extract requirements automatically.
          </p>
          <textarea
            className="input-field"
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="e.g. We are looking for a Senior Backend Engineer with 5+ years of Python experience..."
            required
            rows={13}
            style={{ flex: 1, resize: 'none', lineHeight: 1.6 }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            {jdText.length > 0 ? `${jdText.split(/\s+/).filter(Boolean).length} words` : 'Empty'}
          </div>
        </div>

        {/* ── Right: Resumes + Submit ── */}
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* File Upload */}
          <div className="glass" style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--amber-bg)',
                color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem' }}>02</div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Candidate Resumes</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload PDF or DOCX files. Multiple files supported.
            </p>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                flex: 1, borderRadius: '14px', cursor: 'pointer',
                border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`,
                background: dragOver ? 'var(--bg-accent)' : 'var(--bg-base)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 20px', textAlign: 'center',
                transition: 'all 0.2s ease',
                minHeight: '180px'
              }}
            >
              <input type="file" multiple accept=".pdf,.docx,.json"
                ref={fileInputRef}
                onChange={e => e.target.files.length > 0 && setResumes(e.target.files)}
                style={{ display: 'none' }} required />

              {resumes ? (
                <div className="animate-fade-in">
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📂</div>
                  <p style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '1.1rem' }}>
                    {resumes.length} {resumes.length === 1 ? 'File' : 'Files'} Ready
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {Array.from(resumes).map(f => f.name).join(', ')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--brand)', marginTop: '10px', fontWeight: 600 }}>
                    Click to change files
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.6 }}>📤</div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    Drop resumes here
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    or <span style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}>browse your files</span>
                  </p>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Supports PDF, DOCX, JSON
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}
            style={{ padding: '18px', fontSize: '1rem', fontWeight: 700, borderRadius: '14px' }}>
            {isLoading ? (
              <><div className="spinner-ring" />Evaluating...</>
            ) : (
              <>🚀 Evaluate Candidates</>
            )}
          </button>

          {/* Disclaimer */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Results are AI-generated suggestions. Human review is recommended for final decisions.
          </p>
        </div>
      </form>
    </div>
  );
};

export default UploadSection;

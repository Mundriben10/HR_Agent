import React, { useState, useRef } from 'react';

const UploadSection = ({ onEvaluate, isLoading, progress, completedFiles }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [jdFocused, setJdFocused] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) setResumes(e.dataTransfer.files); };

  /* Loading screen */
  if (isLoading && progress) {
    const pct = (progress.current / progress.total) * 100;
    return (
      <div className="fade-up" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
          background: 'linear-gradient(135deg,#5b4cdb,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(91,76,219,.35)', fontSize: '2rem'
        }}>🤖</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8 }}>Analyzing Talent</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: '.9rem', marginBottom: 32 }}>
          AI agents scoring candidates across 5 dimensions in real-time
        </p>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--ink-2)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {progress.filename || 'Warming up...'}
            </span>
            <span style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--violet)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 24 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {completedFiles.map((n, i) => (
              <span key={i} className="fade-up" style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--emerald-bg)', color: 'var(--emerald)', fontSize: '.75rem', fontWeight: 700 }}>✓ {n}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero ── */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'var(--violet-bg)', marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)' }} />
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--violet)', letterSpacing: '.04em' }}>AI-POWERED SHORTLISTING</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.05, marginBottom: 12 }}>
          Find your next<br /><span style={{ color: 'var(--violet)' }}>top candidate.</span>
        </h1>
        <p style={{ fontSize: '.95rem', color: 'var(--ink-3)', maxWidth: 500, lineHeight: 1.65 }}>
          Paste a job description, upload resumes, and receive a ranked shortlist with transparent AI scoring in seconds.
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* JD Card */}
        <div className={`card ${jdFocused ? 'card-focus' : ''}`} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, gridRow: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--violet-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>📋</div>
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Job Description</span>
            </div>
            <span className="label">{jdText.trim().split(/\s+/).filter(Boolean).length || 0} words</span>
          </div>
          <textarea
            className="input-field"
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            onFocus={() => setJdFocused(true)}
            onBlur={() => setJdFocused(false)}
            placeholder="Paste job description here...&#10;&#10;e.g. We're looking for a Senior Backend Engineer with 5+ years Python experience, strong knowledge of FastAPI or Django, experience with AWS..."
            rows={16}
            style={{ flex: 1 }}
          />
        </div>

        {/* Upload Zone Card */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>📂</div>
            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Candidate Resumes</span>
          </div>

          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{ flex: 1, minHeight: 140 }}
          >
            <input type="file" multiple accept=".pdf,.docx,.json" ref={fileRef} style={{ display: 'none' }} onChange={e => e.target.files.length && setResumes(e.target.files)} />
            {resumes ? (
              <>
                <div style={{ fontSize: '2rem' }}>📁</div>
                <p style={{ fontWeight: 700, color: 'var(--violet)', fontSize: '1rem' }}>{resumes.length} file{resumes.length > 1 ? 's' : ''} selected</p>
                <p style={{ fontSize: '.78rem', color: 'var(--ink-4)' }}>{Array.from(resumes).map(f => f.name).join(' · ')}</p>
                <span style={{ fontSize: '.75rem', color: 'var(--violet)', fontWeight: 600, textDecoration: 'underline' }}>Change files</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', opacity: .5 }}>📤</div>
                <p style={{ fontWeight: 700, color: 'var(--ink-2)', fontSize: '.95rem' }}>Drop resumes here</p>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-4)' }}>or <span style={{ color: 'var(--violet)', fontWeight: 600 }}>browse files</span> · PDF, DOCX, JSON</p>
              </>
            )}
          </div>
        </div>

        {/* Feature tiles row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '🎯', label: '5 Dimensions', desc: 'Skills, experience, education, portfolio, communication' },
            { icon: '⚡', label: 'Real-time', desc: 'See results stream in as each resume is evaluated' },
          ].map((f, i) => (
            <div key={i} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--ink-4)', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Submit button (bottom right) */}
        <button
          className="btn btn-primary"
          onClick={() => onEvaluate(jdText, resumes)}
          disabled={!jdText.trim() || !resumes || isLoading}
          style={{ padding: '16px 28px', fontSize: '1rem', fontWeight: 700, borderRadius: 14, height: 56 }}
        >
          {isLoading ? <><div className="spinner" />Evaluating...</> : <>🚀 Evaluate Candidates</>}
        </button>
      </div>
    </div>
  );
};

export default UploadSection;

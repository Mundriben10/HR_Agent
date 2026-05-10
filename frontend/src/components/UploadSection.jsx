import React, { useState, useRef } from 'react';

/* ════════════ REAL-TIME PROGRESS VIEW ════════════ */
const ProgressView = ({ progress, completedFiles }) => {
  const pct = progress ? Math.round(
    (progress.step === 'all_done' ? 1 : ((completedFiles.length) / progress.total))
  * 100) : 0;
  const allDone = progress?.step === 'all_done';
  const stepLabel = {
    parsing: 'Extracting text',
    scoring: 'AI scoring with rubric',
    done: 'Complete',
    all_done: 'Generating reports & ranking'
  };

  return (
    <div className="glass animate-fade-up" style={{ maxWidth: '740px', margin: '60px auto 0', padding: '48px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: allDone ? 'var(--success)' : 'var(--accent-light)', marginBottom: '8px' }}>
          {allDone ? '✓ All Candidates Evaluated' : 'Agent Pipeline Active'}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {allDone ? 'Preparing Your Shortlist...' : 'Evaluating Your Candidates'}
        </h2>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)' }}>
            {progress ? `${progress.current} of ${progress.total}` : '...'} candidates
          </span>
        </div>
        <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: '5px',
            background: allDone ? 'linear-gradient(90deg, var(--success), #34d399)' : 'linear-gradient(90deg, var(--accent), #a855f7)',
            transition: 'width 0.5s ease-out, background 0.5s ease',
            boxShadow: allDone ? '0 0 12px rgba(16,185,129,0.35)' : '0 0 12px var(--accent-glow)'
          }} />
        </div>
      </div>

      {/* Current file */}
      {progress && (
        <div className="animate-fade-in" style={{
          background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '16px 20px',
          border: '1px solid var(--border-subtle)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            background: progress.step === 'done' ? 'var(--success)' : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {progress.step === 'done' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <div className="spinner-ring" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {progress.filename}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {stepLabel[progress.step] || progress.step}
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
            Step {progress.current}/{progress.total}
          </div>
        </div>
      )}

      {/* Completed list */}
      {completedFiles.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Completed ({completedFiles.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {completedFiles.map((name, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '0.82rem', color: 'var(--success)', opacity: 0.8,
                animation: 'fadeUp 0.3s ease-out forwards'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════ UPLOAD SECTION ════════════ */
const UploadSection = ({ onEvaluate, isLoading, progress, completedFiles }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jdText && resumes && resumes.length > 0) {
      onEvaluate(jdText, resumes);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setResumes(e.dataTransfer.files);
    }
  };

  // Show real-time progress when loading
  if (isLoading) {
    return <ProgressView progress={progress} completedFiles={completedFiles} />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Evaluate Talent
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Deploy our AI agents to analyze resumes against your specific role requirements. 
          Get instant, transparent scoring across five key dimensions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: JD */}
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Job Description</h3>
          </div>
          <textarea
            className="input-field"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste your role requirements here..."
            required
            rows={12}
            style={{ flex: 1, resize: 'none' }}
          />
        </div>

        {/* Right: Files */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Candidate Profiles</h3>
            </div>
            
            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                height: 'calc(100% - 48px)',
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'var(--accent-bg)' : resumes ? 'var(--accent-bg)' : 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                padding: '24px'
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
                <div className="animate-fade-in">
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
                  <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>
                    {resumes.length} Document{resumes.length !== 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '300px', wordBreak: 'break-all' }}>
                    {Array.from(resumes).slice(0, 3).map(f => f.name).join(', ')}
                    {resumes.length > 3 ? ` and ${resumes.length - 3} more...` : ''}
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }}>📥</div>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.1rem' }}>
                    Upload Resumes
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Drag & Drop or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Browse Files</span>
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center' }}>
                    {['PDF', 'DOCX', 'JSON'].map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            disabled={isLoading || !jdText || !resumes}
            style={{ width: '100%', padding: '20px', fontSize: '1.1rem', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Start Intelligence Pipeline
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadSection;

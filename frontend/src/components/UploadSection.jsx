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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Hero */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
          AI-Powered<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent-light), #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Candidate Shortlisting
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
          Upload a job description and candidate profiles. Our AI agent evaluates, scores, and ranks them using a transparent 5-dimension rubric.
        </p>
      </div>

      {/* Feature pills */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px', animationDelay: '0.1s' }}>
        {['PDF / DOCX / JSON', 'LangChain Agent', 'Gemini LLM', '5-Dim Rubric', 'Jinja2 Report'].map(tag => (
          <div key={tag} style={{
            fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)',
            padding: '6px 14px', borderRadius: '20px',
            border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)'
          }}>
            {tag}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="glass animate-fade-up" style={{ padding: '32px', marginBottom: '16px', animationDelay: '0.15s' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Job Description
          </label>
          <textarea
            className="input-field"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here — the AI will extract skills, experience, and qualification requirements..."
            required
            rows={7}
          />
        </div>

        <div className="glass animate-fade-up" style={{ padding: '32px', marginBottom: '24px', animationDelay: '0.2s' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Candidate Profiles
          </label>
          <div
            onClick={() => fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              padding: '36px 24px',
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--accent-bg)' : resumes ? 'var(--accent-bg)' : 'var(--bg-primary)',
              transition: 'all 0.3s ease'
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
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📄</div>
                <p style={{ fontWeight: 600, color: 'var(--accent-light)' }}>
                  {resumes.length} file{resumes.length !== 1 ? 's' : ''} ready
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {Array.from(resumes).map(f => f.name).join(', ')}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px', opacity: 0.5 }}>📂</div>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Drop files here or <span style={{ color: 'var(--accent-light)' }}>browse</span>
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Supports PDF, DOCX, and LinkedIn JSON exports
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <button
            type="submit" className="btn btn-primary"
            disabled={isLoading || !jdText || !resumes}
            style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Run AI Evaluation
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadSection;

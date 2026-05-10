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
      <div className="animate-fade-up" style={{ textAlign: 'center', padding: '80px 0', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em' }}>
            Neural Analysis<br /><span style={{ color: 'var(--accent)' }}>In Progress</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '16px', fontWeight: 500 }}>
            Processing Talent Pipeline...
          </p>
        </div>

        <div className="glass" style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>{progress.filename || 'Initializing...'}</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          
          <div style={{ 
            height: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '100px', overflow: 'hidden',
            boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.8)'
          }}>
            <div style={{ 
              height: '100%', width: `${totalProgress}%`, background: 'var(--accent)', borderRadius: '100px', 
              transition: 'width 0.4s ease', boxShadow: '0 0 20px var(--accent-glow)'
            }} />
          </div>

          <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {completedFiles.map((name, i) => (
              <div key={i} className="animate-fade-up" style={{ 
                padding: '8px 16px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)', 
                fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(0,255,170,0.2)' 
              }}>
                ✓ {name}
              </div>
            ))}
          </div>
        </div>

        {progress.step === 'all_done' && (
          <div className="animate-fade-up" style={{ marginTop: '40px', color: 'var(--success)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Pipeline Synced Successfully
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '60px' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', lineHeight: 0.85, textTransform: 'uppercase' }}>
          Initialize<br /><span style={{ color: 'var(--accent)' }}>Evaluation</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', marginTop: '24px', fontWeight: 500, lineHeight: 1.5 }}>
          Deploy advanced neural agents to filter through your talent pool with 5-dimensional rubric precision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Left: JD */}
        <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>01</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Parameters</h3>
          </div>
          <textarea
            className="input-field"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="PASTE JOB DESCRIPTION HERE..."
            required
            rows={14}
            style={{ flex: 1, resize: 'none' }}
          />
        </div>

        {/* Right: Files */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div className="glass" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>02</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Talent Source</h3>
            </div>
            
            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              style={{
                flex: 1,
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(0,242,255,0.02)' : 'rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '40px',
                boxShadow: 'inset 4px 4px 15px rgba(0,0,0,0.5)'
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
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📄</div>
                  <p style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.4rem', textTransform: 'uppercase' }}>
                    {resumes.length} Profiles Ready
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', maxWidth: '350px', fontWeight: 600 }}>
                    PIPELINE INITIALIZED FOR {Array.from(resumes).length} DOCUMENTS
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.1 }}>📥</div>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase' }}>
                    Upload Resumes
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 600 }}>
                    DRAG & DROP OR <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>BROWSE REPOSITORY</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            disabled={isLoading || !jdText || !resumes}
            style={{ width: '100%', padding: '24px', fontSize: '1.2rem', justifyContent: 'center' }}
          >
            EXECUTE NEURAL LOOP
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadSection;

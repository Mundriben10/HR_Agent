import React, { useState, useRef, useEffect } from 'react';
import { Cpu, FileText, Upload, Target, Zap, Rocket, CheckCircle, ShieldCheck, BarChart3 } from 'lucide-react';

const UploadSection = ({ onEvaluate, isLoading, progress, completedFiles }) => {
  const [jdText, setJdText] = useState('');
  const [resumes, setResumes] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [jdFocused, setJdFocused] = useState(false);
  const [displayPct, setDisplayPct] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const fileRef = useRef();

  const isWarmingUp = !progress;
  const current = progress?.current || 0;
  const total = progress?.total || (resumes?.length ?? 1);
  const basePct = isWarmingUp ? 5 : Math.min(Math.round(((Math.max(current, 1) - 1) / total) * 100 + (100 / total) * 0.5), 99);

  // Sync displayPct if basePct jumps higher (e.g. new file finishes)
  useEffect(() => {
    if (isLoading) {
      setDisplayPct(prev => Math.max(prev, basePct));
    }
  }, [basePct, isLoading]);

  // Tick the displayPct upwards slowly
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setDisplayPct(prev => {
          if (prev >= 99) return 99;
          const chance = prev > 80 ? 0.2 : prev > 50 ? 0.5 : 0.9;
          if (Math.random() < chance) return prev + 1;
          return prev;
        });
      }, 400);
    } else {
      setDisplayPct(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) setResumes(e.dataTransfer.files); };

  /* Loading screen */
  if (isLoading) {
    const filename = progress?.filename || 'Initializing AI model...';
    
    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderWidth: 2, borderTopColor: 'var(--violet)', borderRightColor: 'var(--violet)', borderBottomColor: 'var(--sand-200)', borderLeftColor: 'var(--sand-200)', animationDuration: '1.2s' }} />
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
            {isWarmingUp ? '...' : `${displayPct}%`}
          </span>
        </div>
        <h2 className="serif-heading" style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink)', marginBottom: 12 }}>Analyzing Talent</h2>
        
        <div style={{ color: 'var(--ink-4)', fontSize: '.95rem', marginBottom: 32, fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: '0.01em' }}>
          {isWarmingUp ? 'Connecting to secure AI environment...' : `Evaluating ${current} of ${total}: ${filename}`}
        </div>

        {completedFiles.length > 0 && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
            {completedFiles.map((n, i) => (
              <div key={i} className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: '1px solid var(--sand-200)', borderRadius: '8px' }}>
                <CheckCircle size={14} color="var(--violet)" strokeWidth={2} />
                <span style={{ fontSize: '.85rem', color: 'var(--ink-2)' }}>{n} evaluated</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero ── */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--sand-200)', marginBottom: 24, background: '#fff' }}>
          <ShieldCheck size={14} color="var(--violet)" strokeWidth={1.5} />
          <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--ink-2)', letterSpacing: '.04em' }}>ENTERPRISE AI ANALYSIS</span>
        </div>
        <h1 className="serif-heading" style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: 16 }}>
          Find your next <span style={{ color: 'var(--violet)' }}>top candidate.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--ink-3)', maxWidth: 500, lineHeight: 1.65, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Paste a job description, upload resumes, and receive a ranked shortlist with transparent AI scoring.
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* JD Card */}
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, gridRow: 'span 2', background: '#fff', border: `1px solid ${jdFocused ? 'var(--violet)' : 'var(--sand-200)'}`, borderRadius: '16px', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sand-50)', border: '1px solid var(--sand-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <h3 className="serif-heading" style={{ fontSize: '1.25rem' }}>Job Description</h3>
            </div>
            <span className="label" style={{ fontWeight: 500 }}>{jdText.trim().split(/\s+/).filter(Boolean).length || 0} words</span>
          </div>
          <textarea
            className="input-field"
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            onFocus={() => setJdFocused(true)}
            onBlur={() => setJdFocused(false)}
            placeholder="Paste the job description here to set the baseline..."
            rows={16}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: 0, boxShadow: 'none', fontSize: '1rem', lineHeight: 1.6 }}
          />
        </div>

        {/* Upload Zone Card */}
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', border: '1px solid var(--sand-200)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sand-50)', border: '1px solid var(--sand-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
              <Upload size={18} strokeWidth={1.5} />
            </div>
            <h3 className="serif-heading" style={{ fontSize: '1.25rem' }}>Candidate Resumes</h3>
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
                <FileText size={40} color="var(--violet)" strokeWidth={1.5} />
                <p style={{ fontWeight: 700, color: 'var(--violet)', fontSize: '1rem' }}>{resumes.length} profiles selected</p>
                <p style={{ fontSize: '.78rem', color: 'var(--ink-4)' }}>{Array.from(resumes).map(f => f.name).join(' · ')}</p>
                <span style={{ fontSize: '.75rem', color: 'var(--violet)', fontWeight: 600, textDecoration: 'underline' }}>Update selection</span>
              </>
            ) : (
              <>
                <Upload size={40} color="var(--sand-300)" strokeWidth={1.5} />
                <p style={{ fontWeight: 700, color: 'var(--ink-2)', fontSize: '.95rem' }}>Upload resumes</p>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-4)' }}>or <span style={{ color: 'var(--violet)', fontWeight: 600 }}>browse files</span> · PDF, DOCX, JSON</p>
              </>
            )}
          </div>
        </div>

        {/* Feature tiles row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { icon: <BarChart3 size={20} strokeWidth={1.5} />, label: 'Neural Scoring', desc: 'Evaluates across 5 distinct dimensions.' },
            { icon: <Zap size={20} strokeWidth={1.5} />, label: 'Real-time Analysis', desc: 'Streaming results with justifications.' },
          ].map((f, i) => (
            <div key={i} style={{ padding: 24, background: '#fff', border: '1px solid var(--sand-200)', borderRadius: '16px' }}>
              <div style={{ color: 'var(--ink-4)', marginBottom: 12 }}>{f.icon}</div>
              <h4 className="serif-heading" style={{ fontSize: '1.1rem', marginBottom: 4 }}>{f.label}</h4>
              <div style={{ fontSize: '.85rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        
        {/* API Key Override */}
        <div style={{ background: '#fff', border: '1px solid var(--sand-200)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: 'var(--ink-4)' }}><ShieldCheck size={20} strokeWidth={1.5} /></div>
          <div style={{ flex: 1 }}>
            <p className="label" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              Gemini API Key (Optional)
              <span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--ink-4)' }}>Overrides server default if provided</span>
            </p>
            <input 
              type="password" 
              placeholder="Enter your key..." 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              className="text-input" 
              style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid var(--sand-200)', borderRadius: 0, height: 'auto', fontSize: '.9rem' }} 
            />
          </div>
        </div>

        {/* Submit button (bottom right) */}
        <button
          className="btn btn-primary"
          onClick={() => onEvaluate(jdText, resumes, apiKey)}
          disabled={!jdText.trim() || !resumes || isLoading}
          style={{ padding: '16px 32px', fontSize: '1rem', fontWeight: 500, borderRadius: '6px', height: 56, marginTop: 8 }}
        >
          {isLoading ? <><div className="spinner" />Evaluating...</> : <>Start Evaluation <Rocket size={18} strokeWidth={1.5} /></>}
        </button>
      </div>
    </div>
  );
};

export default UploadSection;

import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/* ─── HELPERS ─── */
const scoreColor = (s) =>
  s >= 8 ? 'var(--success)' : s >= 5 ? 'var(--warning)' : 'var(--danger)';

const scoreBg = (s) =>
  s >= 8 ? 'var(--success-bg)' : s >= 5 ? 'var(--warning-bg)' : 'var(--danger-bg)';

const recClass = (rec) =>
  rec === 'Hire' ? 'hire' : rec === 'No-Hire' ? 'nohire' : 'hold';

const WEIGHTS = {
  skills_match: 0.30, experience_relevance: 0.25, education_certs: 0.15,
  project_portfolio: 0.20, communication_quality: 0.10,
};

const RUBRIC = {
  skills_match:          { label: 'Skills Match',     icon: '🎯', weight: '30%' },
  experience_relevance:  { label: 'Experience',        icon: '💼', weight: '25%' },
  education_certs:       { label: 'Education',         icon: '🎓', weight: '15%' },
  project_portfolio:     { label: 'Portfolio',         icon: '📂', weight: '20%' },
  communication_quality: { label: 'Communication',     icon: '💬', weight: '10%' },
};

const AVATAR_COLORS = [
  ['#d4ede0', '#3a7d59'], ['#e8edf7', '#374ea8'], ['#fde8e8', '#9f3d3d'],
  ['#fff3c4', '#b45309'], ['#f3e8fb', '#7c3aed'], ['#e0f2fe', '#0369a1'],
];

/* ─── SCORE BAR ─── */
const ScoreBar = ({ score }) => {
  const pct = `${score * 10}%`;
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
      <div className="progress-track" style={{ flex: 1, height: '6px' }}>
        <div className="progress-fill" style={{ width: pct, background: color }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, width: '24px', textAlign: 'right',
                     color, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
    </div>
  );
};

/* ─── CANDIDATE MODAL ─── */
const CandidateModal = ({ candidate, onClose, onSave }) => {
  const [edits, setEdits] = useState(
    Object.fromEntries(Object.keys(RUBRIC).map(k => [k, candidate[k]?.score || 0]))
  );
  const [reason, setReason] = useState(candidate.override_reason || '');
  const hasChanges = Object.keys(RUBRIC).some(k => edits[k] !== (candidate[k]?.score || 0));

  const calcTotal = () =>
    Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + edits[k] * w, 0);

  const totalScore = calcTotal();

  const handleSave = async () => {
    if (hasChanges && !reason.trim()) {
      alert('Please provide an override justification.'); return;
    }
    const total = totalScore;
    const updated = {
      ...candidate,
      ...Object.fromEntries(Object.keys(RUBRIC).map(k => [k, { ...candidate[k], score: edits[k] }])),
      total_score: total,
      override_reason: reason,
      is_overridden: hasChanges || candidate.is_overridden,
    };
    if (hasChanges) {
      try {
        await fetch('http://localhost:8000/api/override', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_name: updated.candidate_name, override_reason: reason, new_total_score: total }),
        });
      } catch (e) { console.error(e); }
    }
    onSave(updated);
  };

  const avatarStyle = AVATAR_COLORS[(candidate.candidate_name || '').charCodeAt(0) % AVATAR_COLORS.length];

  /* conic-gradient for the score ring */
  const ringGradient = `conic-gradient(${scoreColor(totalScore)} ${totalScore * 10}%, var(--bg-muted) 0)`;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(28, 37, 38, 0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>

      <div className="glass-strong animate-fade-up" style={{
        width: '100%', maxWidth: '980px', height: '100%', maxHeight: '780px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)' }}>

        {/* ── Modal Header ── */}
        <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar" style={{ width: 44, height: 44, background: avatarStyle[0], color: avatarStyle[1], fontSize: '1.1rem' }}>
              {(candidate.candidate_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {candidate.candidate_name}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                <span className={`tag tag-${recClass(candidate.recommendation)}`}>{candidate.recommendation}</span>
                {candidate.is_overridden && <span className="tag tag-override">HR Edited</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left — Rubric */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-base)' }}>

            <p className="section-label">Scoring Rubric</p>

            {Object.entries(RUBRIC).map(([key, meta]) => {
              const orig = candidate[key] || {};
              const isChanged = edits[key] !== (orig.score || 0);
              return (
                <div key={key} className="glass" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>{meta.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
                      <span style={{ fontSize: '0.7rem', background: 'var(--bg-muted)',
                        padding: '2px 7px', borderRadius: '20px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {meta.weight}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number" min="0" max="10" value={edits[key]}
                        onChange={e => setEdits(p => ({ ...p, [key]: Math.max(0, Math.min(10, +e.target.value)) }))}
                        style={{ width: '52px', padding: '5px 8px', textAlign: 'center',
                          border: `1.5px solid ${isChanged ? 'var(--brand)' : 'var(--border)'}`,
                          borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700, fontSize: '0.95rem', outline: 'none',
                          background: isChanged ? 'var(--bg-accent)' : 'var(--bg-surface)',
                          color: scoreColor(edits[key]), transition: 'all 0.2s' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/10</span>
                    </div>
                  </div>

                  <ScoreBar score={edits[key]} />

                  {orig.justification && (
                    <div style={{ marginTop: '10px', padding: '10px 14px',
                      background: 'var(--bg-base)', borderRadius: '8px',
                      borderLeft: '3px solid var(--border-brand)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {orig.justification}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right — Summary */}
          <div style={{ width: '320px', background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

            {/* Score ring */}
            <div style={{ padding: '36px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 130, height: 130, borderRadius: '50%', margin: '0 auto 18px',
                background: ringGradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-md)' }}>
                <div style={{ width: 104, height: 104, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor(totalScore),
                    letterSpacing: '-0.03em', lineHeight: 1 }}>{totalScore.toFixed(1)}</span>
                  <span className="section-label" style={{ marginTop: '2px' }}>Score</span>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Composite Match Score
              </div>
            </div>

            {/* Contribution table */}
            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
              <p className="section-label" style={{ marginBottom: '14px' }}>Contribution Breakdown</p>
              {Object.entries(RUBRIC).map(([key, meta]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{meta.icon}</span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{meta.label}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace" }}>
                    +{(edits[key] * WEIGHTS[key]).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Override textarea */}
            {hasChanges && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700,
                  marginBottom: '8px', color: 'var(--amber)' }}>
                  Override Justification *
                </label>
                <textarea className="input-field" value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why you changed these scores..."
                  rows={3} style={{ resize: 'none', fontSize: '0.85rem' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─── RESULTS DASHBOARD ─── */
const ResultsDashboard = ({ results: initialResults, onReset }) => {
  const [candidates, setCandidates] = useState(initialResults);
  const [selected, setSelected] = useState(null);

  const handleSave = (updated) => {
    const next = candidates.map(c => c.candidate_name === updated.candidate_name ? updated : c);
    next.sort((a, b) => b.total_score - a.total_score);
    setCandidates(next);
    setSelected(null);
  };

  const topScore = Math.max(...candidates.map(c => c.total_score || 0));
  const hired = candidates.filter(c => c.recommendation === 'Hire').length;
  const hold  = candidates.filter(c => c.recommendation === 'Hold').length;
  const avg   = (candidates.reduce((s, c) => s + (c.total_score || 0), 0) / candidates.length).toFixed(1);

  return (
    <div className="animate-fade-up" style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Evaluation Complete</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Candidate Shortlist
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem' }}>
            {candidates.length} candidates ranked by multi-dimensional AI analysis
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onReset} style={{ gap: '6px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          New Evaluation
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Candidates', value: candidates.length, icon: '👥', color: 'var(--brand)' },
          { label: 'Top Score',  value: topScore.toFixed(1), icon: '🏆', color: 'var(--warning)' },
          { label: 'Shortlisted', value: hired, icon: '✅', color: 'var(--success)' },
          { label: 'Avg Score',  value: avg,  icon: '📊', color: 'var(--text-secondary)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stripe-color': s.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.02em', marginTop: '8px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Table ── */}
      <div className="glass-strong" style={{ overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 140px 120px 90px',
          padding: '14px 24px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)',
          gap: '16px', alignItems: 'center' }}>
          {['Rank', 'Candidate', 'Score', 'Match Profile', 'Status', 'Action'].map((col, i) => (
            <span key={i} className="section-label" style={{ textAlign: i >= 3 ? 'center' : 'left' }}>{col}</span>
          ))}
        </div>

        {/* Table rows */}
        <div className="stagger">
          {candidates.map((c, i) => {
            const score = c.total_score || 0;
            const avatarStyle = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n';

            return (
              <div key={i}
                onClick={() => setSelected(c)}
                style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 140px 120px 90px',
                  padding: '18px 24px', gap: '16px', alignItems: 'center',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'background 0.15s ease', background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Rank */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className={`rank-badge ${rankClass}`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                </div>

                {/* Candidate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: 38, height: 38,
                    background: avatarStyle[0], color: avatarStyle[1], fontSize: '0.95rem' }}>
                    {(c.candidate_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {c.candidate_name}
                    </div>
                    {c.is_overridden && (
                      <span className="tag tag-override" style={{ fontSize: '0.65rem', marginTop: '2px' }}>Edited</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor(score),
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
                    {score.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>/10</span>
                </div>

                {/* Match Profile Bar */}
                <div>
                  <div className="progress-track" style={{ height: '7px' }}>
                    <div className="progress-fill" style={{
                      width: `${score * 10}%`,
                      background: scoreColor(score)
                    }} />
                  </div>
                </div>

                {/* Status */}
                <div style={{ textAlign: 'center' }}>
                  <span className={`tag tag-${recClass(c.recommendation)}`}>{c.recommendation}</span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); setSelected(c); }}
                    style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
    </div>
  );
};

export default ResultsDashboard;

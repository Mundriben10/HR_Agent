import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/* ════════════ SCORE BAR ════════════ */
const ScoreBar = ({ score, size = 'md' }) => {
  const pct = `${score * 10}%`;
  let color = 'var(--danger)';
  if (score >= 8) color = 'var(--success)';
  else if (score >= 5) color = 'var(--warning)';
  else if (score >= 3) color = 'var(--accent)';

  const h = size === 'sm' ? '6px' : '8px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
      <div style={{ flex: 1, height: h, background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct, background: color, borderRadius: '100px', transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 800, width: '32px', textAlign: 'right', color }}>{score}</span>
    </div>
  );
};

/* ════════════ RUBRIC ROW ════════════ */
const RUBRIC = {
  skills_match: { label: 'Skills Match', weight: '30%', poor: '<30% match', avg: '50–70% match', exc: '>85% match' },
  experience_relevance: { label: 'Experience', weight: '25%', poor: 'Unrelated domain', avg: 'Adjacent domain', exc: 'Exact domain & seniority' },
  education_certs: { label: 'Education & Certs', weight: '15%', poor: 'Below minimum', avg: 'Meets minimum', exc: 'Exceeds + extra certs' },
  project_portfolio: { label: 'Project / Portfolio', weight: '20%', poor: 'No evidence', avg: '1–2 generic projects', exc: 'Strong relevant portfolio' },
  communication_quality: { label: 'Communication', weight: '10%', poor: 'Poor structure', avg: 'Adequate clarity', exc: 'Crisp & impactful' },
};

/* ════════════ DETAIL MODAL ════════════ */
const CandidateModal = ({ candidate, onClose, onSave }) => {
  const [edits, setEdits] = useState(
    Object.fromEntries(Object.keys(RUBRIC).map(k => [k, candidate[k]?.score || 0]))
  );
  const [reason, setReason] = useState(candidate.override_reason || '');
  const hasChanges = Object.keys(RUBRIC).some(k => edits[k] !== (candidate[k]?.score || 0));

  const handleScore = (dim, v) => setEdits(p => ({ ...p, [dim]: Math.max(0, Math.min(10, Number(v))) }));

  const calcTotal = () =>
    edits.skills_match * 0.3 + edits.experience_relevance * 0.25 + edits.education_certs * 0.15 +
    edits.project_portfolio * 0.2 + edits.communication_quality * 0.1;

  const handleSave = async () => {
    if (hasChanges && !reason) { alert('Please provide an override reason.'); return; }
    const total = calcTotal();
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

  const scoreColor = (s) => s >= 8 ? 'var(--success)' : s >= 5 ? 'var(--warning)' : 'var(--danger)';
  const weights = { skills_match: 0.3, experience_relevance: 0.25, education_certs: 0.15, project_portfolio: 0.2, communication_quality: 0.1 };
  const totalScore = calcTotal();

  const modalContent = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(29, 29, 27, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }}>
      <div className="glass-strong animate-fade-up" style={{ 
        width: '100%', maxWidth: '1100px', height: '100%', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '20px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '14px',
              background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)'
            }}>
              {(candidate.candidate_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{candidate.candidate_name}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <span className={`tag tag-${candidate.recommendation === 'Hire' ? 'hire' : candidate.recommendation === 'No-Hire' ? 'nohire' : 'hold'}`}>
                  {candidate.recommendation}
                </span>
                {candidate.is_overridden && <span className="tag tag-override">HR Modified</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary">Apply Changes</button>
          </div>
        </div>

        {/* Split Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Rubric Scoring */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dimension Scoring</h4>
            {Object.entries(RUBRIC).map(([key, meta]) => {
              const orig = candidate[key] || { score: 0, justification: 'N/A' };
              return (
                <div key={key} className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{meta.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Weight: {meta.weight}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number" min="0" max="10" value={edits[key]}
                        onChange={e => handleScore(key, e.target.value)}
                        style={{
                          width: '54px', padding: '8px', borderRadius: '10px', textAlign: 'center',
                          background: 'var(--bg-tertiary)', border: `2px solid ${edits[key] !== orig.score ? 'var(--accent)' : 'transparent'}`,
                          color: scoreColor(edits[key]), fontWeight: 900, fontSize: '1rem', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  </div>
                  <ScoreBar score={edits[key]} size="sm" />
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { l: 'Poor', v: meta.poor, min: 0, max: 3, c: 'var(--danger)' },
                      { l: 'Average', v: meta.avg, min: 4, max: 7, c: 'var(--warning)' },
                      { l: 'Excellent', v: meta.exc, min: 8, max: 10, c: 'var(--success)' }
                    ].map(range => {
                      const active = edits[key] >= range.min && edits[key] <= range.max;
                      return (
                        <div key={range.l} style={{
                          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800,
                          textAlign: 'center', transition: 'all 0.2s',
                          background: active ? 'var(--bg-secondary)' : 'transparent',
                          color: active ? range.c : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--border-subtle)' : 'transparent'}`
                        }}>
                          {range.l}
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '10px', fontStyle: 'italic' }}>
                    "{orig.justification}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Summary & Overrides */}
          <div style={{ width: '380px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            {/* Giant Score Ring */}
            <div style={{ padding: '40px 32px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%', margin: '0 auto 20px',
                background: `conic-gradient(${scoreColor(totalScore)} ${totalScore * 10}%, var(--bg-tertiary) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: scoreColor(totalScore), letterSpacing: '-0.04em' }}>{totalScore.toFixed(1)}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aggregate</span>
                </div>
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Profile Strength</h4>
            </div>

            {/* Weights */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
               <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Weightage Analysis</h4>
               {Object.entries(RUBRIC).map(([key, meta]) => (
                 <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                   <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{meta.label}</span>
                   <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{(edits[key] * weights[key]).toFixed(2)}</span>
                 </div>
               ))}
            </div>

            {/* Override Area */}
            <div style={{ padding: '24px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>HR Rationalization</label>
              <textarea
                className="input-field"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Required for any score adjustments..."
                rows={4}
                style={{ background: 'var(--bg-secondary)', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

/* ════════════ RESULTS DASHBOARD ════════════ */
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

  return (
    <div className="animate-fade-up" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Shortlist Intelligence</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '6px' }}>
            Analysis complete for <strong>{candidates.length}</strong> candidates. 
            Ranked by overall dimension match.
          </p>
        </div>
        <button onClick={onReset} className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Reset Session
        </button>
      </div>

      {/* Metrics Row */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Pool Size', value: candidates.length, color: 'var(--text-primary)' },
          { label: 'Benchmark', value: topScore.toFixed(1), color: 'var(--success)' },
          { label: 'Shortlisted', value: candidates.filter(c => c.recommendation === 'Hire').length, color: 'var(--accent)' },
          { label: 'Review Loop', value: candidates.filter(c => c.recommendation === 'Hold').length, color: 'var(--warning)' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="glass-strong" style={{ overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 120px 160px 140px 100px',
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-tertiary)', fontSize: '0.75rem', fontWeight: 900,
          color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          <span>Rank</span>
          <span>Candidate Detail</span>
          <span>Score</span>
          <span style={{ textAlign: 'center' }}>Match Profile</span>
          <span style={{ textAlign: 'center' }}>Verdict</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        <div className="stagger">
          {candidates.map((c, i) => {
            const score = c.total_score || 0;
            const pct = (score / 10) * 100;
            const recClass = c.recommendation === 'Hire' ? 'hire' : c.recommendation === 'No-Hire' ? 'nohire' : 'hold';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 120px 160px 140px 100px',
                padding: '24px', alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                background: 'var(--bg-secondary)'
              }}
                onClick={() => setSelected(c)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              >
                {/* Rank */}
                <div style={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: i === 0 ? 'var(--success-bg)' : i === 1 ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                  color: i === 0 ? 'var(--success)' : i === 1 ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.85rem'
                }}>
                  {i + 1}
                </div>

                {/* Candidate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '14px',
                    background: `linear-gradient(135deg, hsl(${(i * 45) % 360}, 70%, 94%), hsl(${(i * 45) % 360}, 70%, 88%))`,
                    color: `hsl(${(i * 45) % 360}, 70%, 40%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.1rem', border: '1px solid rgba(0,0,0,0.03)'
                  }}>
                    {(c.candidate_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.candidate_name}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      {c.is_overridden && <span className="tag tag-override" style={{ fontSize: '0.6rem' }}>Modified</span>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Profile</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)', letterSpacing: '-0.02em' }}>
                  {score.toFixed(1)}<span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 600 }}>/10</span>
                </div>

                {/* Profile Bar */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '100px',
                      background: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ textAlign: 'center' }}>
                  <span className={`tag tag-${recClass}`} style={{ minWidth: '80px', textAlign: 'center' }}>{c.recommendation}</span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 800, borderRadius: '10px' }}>
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <CandidateModal candidate={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}
    </div>
  );
};

export default ResultsDashboard;

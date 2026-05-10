import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/* ════════════ SCORE BAR (PREMIUM SAAS) ════════════ */
const ScoreBar = ({ score, size = 'md' }) => {
  const pct = `${score * 10}%`;
  let color = 'var(--accent)';
  if (score >= 8) color = 'var(--success)';
  else if (score >= 5) color = 'var(--warning)';

  const h = size === 'sm' ? '6px' : '8px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
      <div style={{ 
        flex: 1, height: h, background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden'
      }}>
        <div style={{ 
          height: '100%', width: pct, background: color, borderRadius: '100px', 
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '32px', textAlign: 'right', color: 'var(--text-primary)' }}>{score}</span>
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

/* ════════════ DETAIL MODAL (PREMIUM SAAS) ════════════ */
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
  const totalScore = calcTotal();

  const modalContent = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }}>
      <div className="glass-strong animate-fade-up" style={{ 
        width: '100%', maxWidth: '1000px', height: '100%', maxHeight: '800px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Top bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border-subtle)',
          padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1rem', color: 'var(--accent)'
            }}>
              {(candidate.candidate_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{candidate.candidate_name}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <span className={`tag tag-${candidate.recommendation === 'Hire' ? 'hire' : candidate.recommendation === 'No-Hire' ? 'nohire' : 'hold'}`}>
                  {candidate.recommendation}
                </span>
                {candidate.is_overridden && <span className="tag tag-override">Modified</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
          </div>
        </div>

        {/* Split Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Scoring */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimension Analysis</h4>
            {Object.entries(RUBRIC).map(([key, meta]) => {
              const orig = candidate[key] || { score: 0, justification: 'N/A' };
              return (
                <div key={key} className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{meta.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight: {meta.weight}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number" min="0" max="10" value={edits[key]}
                        onChange={e => handleScore(key, e.target.value)}
                        className="input-field"
                        style={{ width: '54px', padding: '6px', textAlign: 'center', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  <ScoreBar score={edits[key]} size="sm" />
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{orig.justification}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Summary */}
          <div style={{ width: '360px', background: '#fff', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '40px 32px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
                background: `conic-gradient(${scoreColor(totalScore)} ${totalScore * 10}%, var(--bg-tertiary) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalScore.toFixed(1)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score</span>
                </div>
              </div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Match Profile</h4>
            </div>

            <div style={{ padding: '24px 32px', flex: 1, overflowY: 'auto' }}>
               <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Impact Breakdown</h4>
               {Object.entries(RUBRIC).map(([key, meta]) => (
                 <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                   <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{meta.label}</span>
                   <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{(edits[key] * (parseFloat(meta.weight)/100 * 10)).toFixed(1)}</span>
                 </div>
               ))}
            </div>

            <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Override Rationale</label>
              <textarea
                className="input-field"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Required for adjustments..."
                rows={3}
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

/* ════════════ RESULTS DASHBOARD (PREMIUM SAAS) ════════════ */
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
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Ranked Shortlist</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>
            Analysis complete. We've evaluated <strong>{candidates.length}</strong> candidates.
          </p>
        </div>
        <button onClick={onReset} className="btn btn-ghost">
          New Evaluation
        </button>
      </div>

      {/* Metrics Row */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Candidates', value: candidates.length, icon: '👥' },
          { label: 'Benchmark Score', value: topScore.toFixed(1), icon: '📈' },
          { label: 'Strong Matches', value: candidates.filter(c => c.recommendation === 'Hire').length, icon: '✨' },
          { label: 'Requires Review', value: candidates.filter(c => c.recommendation === 'Hold').length, icon: '⏳' },
        ].map((m, i) => (
          <div key={i} className="glass" style={{ padding: '24px', background: '#fff' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{m.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="glass-strong" style={{ overflow: 'hidden', background: '#fff' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 100px 160px 140px 100px',
          padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)', fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <span>Rank</span>
          <span>Candidate</span>
          <span>Score</span>
          <span style={{ textAlign: 'center' }}>Match</span>
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
                display: 'grid', gridTemplateColumns: '80px 1fr 100px 160px 140px 100px',
                padding: '20px 24px', alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
                onClick={() => setSelected(c)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Rank */}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {i + 1}
                </div>

                {/* Candidate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9rem'
                  }}>
                    {(c.candidate_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{c.candidate_name}</div>
                    {c.is_overridden && <span className="tag tag-override" style={{ fontSize: '0.625rem', marginTop: '2px', display: 'inline-block' }}>Edited</span>}
                  </div>
                </div>

                {/* Score */}
                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {score.toFixed(1)}
                </div>

                {/* Profile Bar */}
                <div style={{ padding: '0 12px' }}>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '100px',
                      background: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 1s ease'
                    }} />
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ textAlign: 'center' }}>
                  <span className={`tag tag-${recClass}`} style={{ minWidth: '80px', textAlign: 'center' }}>{c.recommendation}</span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8125rem' }}>
                    Details
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

import React, { useState } from 'react';

/* ════════════ SCORE BAR ════════════ */
const ScoreBar = ({ score, size = 'md' }) => {
  const pct = `${score * 10}%`;
  let color = 'var(--danger)';
  if (score >= 8) color = 'var(--success)';
  else if (score >= 5) color = 'var(--warning)';
  else if (score >= 3) color = 'var(--info)';

  const h = size === 'sm' ? '4px' : '6px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
      <div style={{ flex: 1, height: h, background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct, background: color, borderRadius: '3px', transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, width: '32px', textAlign: 'right', color }}>{score}</span>
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

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
      overflowY: 'auto', padding: '48px 16px'
    }}>
      <div onClick={e => e.stopPropagation()} className="glass-strong animate-fade-up" style={{
        width: '100%', maxWidth: '860px', padding: '0', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>{candidate.candidate_name}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`tag tag-${candidate.recommendation === 'Hire' ? 'hire' : candidate.recommendation === 'No-Hire' ? 'nohire' : 'hold'}`}>
                {candidate.recommendation}
              </span>
              {candidate.is_overridden && <span className="tag tag-override">HR Edited</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Weighted Total</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-light)', letterSpacing: '-0.03em' }}>
              {calcTotal().toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/10</span>
            </div>
          </div>
        </div>

        {/* Rubric Table */}
        <div style={{ padding: '24px 32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Transparent Scoring Rubric
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(RUBRIC).map(([key, meta]) => {
              const orig = candidate[key] || { score: 0, justification: 'N/A' };
              return (
                <div key={key} style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px 20px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {/* Top row: label + weight + score input */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({meta.weight})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number" min="0" max="10" value={edits[key]}
                        onChange={e => handleScore(key, e.target.value)}
                        style={{
                          width: '52px', padding: '5px 8px', borderRadius: '8px', textAlign: 'center',
                          background: 'rgba(0,0,0,0.4)', border: `1px solid ${edits[key] !== orig.score ? 'var(--accent)' : 'var(--border-subtle)'}`,
                          color: scoreColor(edits[key]), fontFamily: 'Inter', fontWeight: 700, fontSize: '0.9rem', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  </div>
                  <ScoreBar score={edits[key]} size="sm" />

                  {/* Rubric criteria — active range highlighted */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {[
                      { l: '0 – Poor', v: meta.poor, min: 0, max: 3, color: 'var(--danger)', bg: 'var(--danger-bg)', border: 'rgba(239,68,68,0.3)' },
                      { l: '5 – Average', v: meta.avg, min: 4, max: 7, color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,158,11,0.3)' },
                      { l: '10 – Excellent', v: meta.exc, min: 8, max: 10, color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(16,185,129,0.3)' }
                    ].map(c => {
                      const isActive = edits[key] >= c.min && edits[key] <= c.max;
                      return (
                        <div key={c.l} style={{
                          fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', flex: 1, minWidth: '120px',
                          color: isActive ? c.color : 'var(--text-muted)',
                          background: isActive ? c.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isActive ? c.border : 'var(--border-subtle)'}`,
                          transition: 'all 0.3s ease',
                          boxShadow: isActive ? `0 0 8px ${c.border}` : 'none'
                        }}>
                          <span style={{ fontWeight: 700 }}>{c.l}</span><br />
                          <span style={{ opacity: 0.85 }}>{c.v}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Justification */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{orig.justification}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override */}
        <div style={{ padding: '0 32px 28px' }}>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem',
              color: hasChanges ? 'var(--warning)' : 'var(--text-primary)'
            }}>
              HR Override Reason {hasChanges && <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>(required)</span>}
            </label>
            <textarea
              className="input-field"
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="If you changed any scores, explain your rationale here..."
              rows={2}
              style={{ borderColor: hasChanges && !reason ? 'var(--danger)' : undefined }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="animate-fade-up" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-light)', marginBottom: '6px' }}>
            Evaluation Complete
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Ranked Shortlist
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} evaluated • Reports saved to server
          </p>
        </div>
        <button onClick={onReset} className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          New Evaluation
        </button>
      </div>

      {/* Summary cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Evaluated</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{candidates.length}</div>
        </div>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Top Score</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.03em' }}>{topScore.toFixed(1)}</div>
        </div>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Recommended Hires</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-light)', letterSpacing: '-0.03em' }}>
            {candidates.filter(c => c.recommendation === 'Hire').length}
          </div>
        </div>
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>On Hold</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', letterSpacing: '-0.03em' }}>
            {candidates.filter(c => c.recommendation === 'Hold').length}
          </div>
        </div>
      </div>

      {/* Candidate Rows */}
      <div className="glass-strong" style={{ overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '48px 1fr 100px 140px 100px 100px',
          padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.3)', fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          <span>Rank</span><span>Candidate</span><span>Score</span><span style={{ textAlign: 'center' }}>Match</span><span style={{ textAlign: 'center' }}>Decision</span><span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {/* Rows */}
        <div className="stagger">
          {candidates.map((c, i) => {
            const score = c.total_score || 0;
            const pct = topScore > 0 ? (score / 10) * 100 : 0;
            const recClass = c.recommendation === 'Hire' ? 'hire' : c.recommendation === 'No-Hire' ? 'nohire' : 'hold';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 100px 140px 100px 100px',
                padding: '16px 24px', alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setSelected(c)}
              >
                {/* Rank */}
                <span style={{
                  fontWeight: 800, fontSize: '1rem',
                  color: i === 0 ? 'var(--success)' : i === 1 ? 'var(--accent-light)' : 'var(--text-muted)'
                }}>
                  {i + 1}
                </span>

                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '10px',
                    background: `linear-gradient(135deg, hsl(${(i * 60) % 360}, 60%, 50%), hsl(${(i * 60 + 40) % 360}, 60%, 40%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0
                  }}>
                    {(c.candidate_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.candidate_name}</div>
                    {c.is_overridden && <span className="tag tag-override" style={{ marginTop: '2px' }}>HR Edited</span>}
                  </div>
                </div>

                {/* Score */}
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)' }}>
                  {score.toFixed(1)}
                </div>

                {/* Bar */}
                <div style={{ padding: '0 8px' }}>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '3px',
                      background: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 1.2s cubic-bezier(.4,0,.2,1)'
                    }} />
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{ textAlign: 'center' }}>
                  <span className={`tag tag-${recClass}`}>{c.recommendation}</span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={e => { e.stopPropagation(); setSelected(c); }}>
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <CandidateModal candidate={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}
    </div>
  );
};

export default ResultsDashboard;

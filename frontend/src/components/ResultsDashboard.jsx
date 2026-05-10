import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/* ════════════ SCORE BAR (CRED NEO) ════════════ */
const ScoreBar = ({ score, size = 'md' }) => {
  const pct = `${score * 10}%`;
  let color = 'var(--accent)';
  if (score >= 8) color = 'var(--success)';
  else if (score >= 5) color = 'var(--warning)';

  const h = size === 'sm' ? '8px' : '12px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
      <div style={{ 
        flex: 1, height: h, background: 'var(--bg-tertiary)', borderRadius: '100px', overflow: 'hidden',
        boxShadow: 'var(--shadow-neo-inset)'
      }}>
        <div style={{ 
          height: '100%', width: pct, background: color, borderRadius: '100px', 
          transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `0 0 10px ${color}44`
        }} />
      </div>
      <span style={{ fontSize: '0.9rem', fontWeight: 900, width: '36px', textAlign: 'right', color: 'var(--text-primary)' }}>{score}</span>
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

/* ════════════ DETAIL MODAL (CRED STYLE) ════════════ */
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
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(15px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }}>
      <div className="glass-strong animate-fade-up" style={{ 
        width: '100%', maxWidth: '1200px', height: '100%', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 50px 100px rgba(0,0,0,0.8)'
      }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '24px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '18px',
              background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.4rem', color: '#000',
              boxShadow: '0 0 30px rgba(255,255,255,0.2)'
            }}>
              {(candidate.candidate_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>{candidate.candidate_name}</h2>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <span className={`tag tag-${candidate.recommendation === 'Hire' ? 'hire' : candidate.recommendation === 'No-Hire' ? 'nohire' : 'hold'}`}>
                  {candidate.recommendation}
                </span>
                {candidate.is_overridden && <span className="tag tag-override">Override Active</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={onClose} className="btn btn-ghost">Dismiss</button>
            <button onClick={handleSave} className="btn btn-primary">Confirm Changes</button>
          </div>
        </div>

        {/* Split Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Scoring */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Performance Rubric</h4>
            {Object.entries(RUBRIC).map(([key, meta]) => {
              const orig = candidate[key] || { score: 0, justification: 'N/A' };
              return (
                <div key={key} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{meta.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WEIGHT: {meta.weight}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="number" min="0" max="10" value={edits[key]}
                        onChange={e => handleScore(key, e.target.value)}
                        className="input-field"
                        style={{ width: '60px', padding: '10px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, color: scoreColor(edits[key]) }}
                      />
                    </div>
                  </div>
                  <ScoreBar score={edits[key]} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderLeft: `3px solid ${scoreColor(edits[key])}` }}>
                    "{orig.justification}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Summary */}
          <div style={{ width: '420px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '50px 40px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 180, height: 180, borderRadius: '50%', margin: '0 auto 30px',
                background: `conic-gradient(${scoreColor(totalScore)} ${totalScore * 10}%, rgba(255,255,255,0.05) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${scoreColor(totalScore)}22`
              }}>
                <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: 'var(--shadow-neo)' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.05em' }}>{totalScore.toFixed(1)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Composite Score</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto' }}>
               <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>Contribution Matrix</h4>
               {Object.entries(RUBRIC).map(([key, meta]) => (
                 <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                   <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{meta.label}</span>
                   <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{(edits[key] * (parseFloat(meta.weight)/100 * 10)).toFixed(2)}</span>
                 </div>
               ))}
            </div>

            <div style={{ padding: '32px 40px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--accent)' }}>Override Justification</label>
              <textarea
                className="input-field"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="MANDATORY FOR SCORE UPDATES..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

/* ════════════ RESULTS DASHBOARD (CRED NEO) ════════════ */
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
    <div className="animate-fade-up" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
        <div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', lineHeight: 0.9 }}>
            Candidate<br /><span style={{ color: 'var(--accent-neon)' }}>Intelligence</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '16px', fontWeight: 500 }}>
            {candidates.length} Profiles analyzed via Neural Shortlisting Agent.
          </p>
        </div>
        <button onClick={onReset} className="btn btn-ghost" style={{ padding: '16px 32px' }}>
          Initialize New Loop
        </button>
      </div>

      {/* Metrics Matrix */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '50px' }}>
        {[
          { label: 'Pool Depth', value: candidates.length, color: 'var(--text-primary)' },
          { label: 'Peak Rating', value: topScore.toFixed(1), color: 'var(--success)' },
          { label: 'Shortlisted', value: candidates.filter(c => c.recommendation === 'Hire').length, color: 'var(--accent-neon)' },
          { label: 'Review Loop', value: candidates.filter(c => c.recommendation === 'Hold').length, color: 'var(--warning)' },
        ].map((m, i) => (
          <div key={i} className="glass" style={{ padding: '32px', textAlign: 'left', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>{m.label}</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: m.color, letterSpacing: '-0.04em' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid Area */}
      <div className="glass-strong" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '100px 1fr 140px 200px 180px 140px',
          padding: '24px 40px', borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.02)', fontSize: '0.8rem', fontWeight: 900,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em'
        }}>
          <span>RANK</span>
          <span>CANDIDATE PROFILE</span>
          <span>RATING</span>
          <span style={{ textAlign: 'center' }}>MATCH INDEX</span>
          <span style={{ textAlign: 'center' }}>VERDICT</span>
          <span style={{ textAlign: 'right' }}>COMMAND</span>
        </div>

        <div className="stagger">
          {candidates.map((c, i) => {
            const score = c.total_score || 0;
            const pct = (score / 10) * 100;
            const recClass = c.recommendation === 'Hire' ? 'hire' : c.recommendation === 'No-Hire' ? 'nohire' : 'hold';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 140px 200px 180px 140px',
                padding: '32px 40px', alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                background: 'transparent'
              }}
                onClick={() => setSelected(c)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Rank */}
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  #{i + 1}
                </div>

                {/* Candidate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '18px',
                    background: i === 0 ? '#000' : 'var(--bg-tertiary)',
                    color: i === 0 ? '#fff' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.4rem', boxShadow: i === 0 ? '0 10px 25px rgba(0,0,0,0.2)' : 'var(--shadow-neo)'
                  }}>
                    {(c.candidate_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{c.candidate_name}</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                      {c.is_overridden && <span className="tag tag-override" style={{ fontSize: '0.65rem' }}>OVERRIDDEN</span>}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IDENTITY VERIFIED</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ fontWeight: 900, fontSize: '1.8rem', color: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)', letterSpacing: '-0.04em' }}>
                  {score.toFixed(1)}
                </div>

                {/* Profile Bar */}
                <div style={{ padding: '0 20px' }}>
                  <div style={{ 
                    height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '100px', overflow: 'hidden',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)' 
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '100px',
                      background: score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: `0 0 15px ${score >= 7 ? 'var(--success)' : 'var(--warning)'}66`
                    }} />
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ textAlign: 'center' }}>
                  <span className={`tag tag-${recClass}`} style={{ minWidth: '100px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>{c.recommendation}</span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: '0.8rem', fontWeight: 900, borderRadius: '12px' }}>
                    INSPECT
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

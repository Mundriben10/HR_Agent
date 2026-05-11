import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Target, Briefcase, GraduationCap, FolderOpen, MessageSquare, Users, CheckCircle, Clock, Trophy, RotateCcw, Search } from 'lucide-react';

const W = { skills_match:.30, experience_relevance:.25, education_certs:.15, project_portfolio:.20, communication_quality:.10 };
const DIM = {
  skills_match:          { label:'Skills Match',        icon: <Target size={14} strokeWidth={1.5} /> },
  experience_relevance:  { label:'Experience Relevance',icon: <Briefcase size={14} strokeWidth={1.5} /> },
  education_certs:       { label:'Education & Certs',   icon: <GraduationCap size={14} strokeWidth={1.5} /> },
  project_portfolio:     { label:'Project / Portfolio', icon: <FolderOpen size={14} strokeWidth={1.5} /> },
  communication_quality: { label:'Communication Quality',icon: <MessageSquare size={14} strokeWidth={1.5} /> },
};

const AVATAR_PALETTES = [
  ['#ede9fe','#5b21b6'],['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],
  ['#d1fae5','#065f46'],['#fef3c7','#92400e'],['#fee2e2','#991b1b'],
];

const sc = s => s > 7.5 ? 'var(--emerald)' : s >= 4 ? 'var(--amber)' : 'var(--rose)';
const rc = r => r === 'Hire' ? 'hire' : r === 'No-Hire' ? 'nohire' : 'hold';
const getCategory = s => s > 7.5 ? 'Excellent' : s >= 4 ? 'Average' : 'Poor';
const getCatColor = s => s > 7.5 ? 'var(--emerald)' : s >= 4 ? 'var(--amber)' : 'var(--rose)';

/* ── MINI DIMENSION BARS ── */
const DimBars = ({ candidate }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {Object.entries(DIM).map(([k, m]) => {
      const s = candidate[k]?.score ?? 0;
      const weight = Math.round(W[k] * 100);
      const category = getCategory(s);
      const color = getCatColor(s);
      return (
        <div key={k} style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'var(--ink-4)', display:'flex' }}>{m.icon}</span>
              <span style={{ fontSize:'.75rem', fontWeight:600, color:'var(--ink-2)' }}>
                {m.label} <span style={{ color:'var(--ink-4)', fontWeight:500 }}>(Weight: {weight}%)</span>
              </span>
            </div>
            <span style={{ fontSize:'.7rem', fontWeight:800, color, padding:'2px 8px', borderRadius:6, background:`${color}15`, whiteSpace:'nowrap' }}>
              {category} · {s}/10
            </span>
          </div>
          <div className="mini-bar">
            <div className="mini-bar-fill" style={{ width:`${s*10}%`, background:color }} />
          </div>
        </div>
      );
    })}
  </div>
);

/* ── SCORE RING ── */
const Ring = ({ score, size=90 }) => {
  const color = sc(score);
  return (
    <div className="score-ring" style={{ width:size, height:size, background:`conic-gradient(${color} ${score*10}%, var(--sand-100) 0)`, borderRadius:'50%', flexShrink:0 }}>
      <div className="score-ring-inner" style={{ width:size-14, height:size-14 }}>
        <span style={{ fontSize:size<80?'1.1rem':'1.4rem', fontWeight:900, color, letterSpacing:'-.03em', lineHeight:1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize:'.55rem', color:'var(--ink-4)', fontWeight:700, marginTop:1 }}>/ 10</span>
      </div>
    </div>
  );
};

/* ── CANDIDATE MODAL ── */
const Modal = ({ candidate, onClose, onSave }) => {
  const [edits, setEdits] = useState(Object.fromEntries(Object.keys(DIM).map(k=>[k, candidate[k]?.score||0])));
  const [reason, setReason] = useState(candidate.override_reason || '');
  const hasChanges = Object.keys(DIM).some(k => edits[k] !== (candidate[k]?.score||0));
  const total = Object.entries(W).reduce((s,[k,w])=>s+edits[k]*w,0);
  const pal = AVATAR_PALETTES[(candidate.candidate_name||'').charCodeAt(0)%AVATAR_PALETTES.length];

  const save = async () => {
    if (hasChanges && !reason.trim()) { alert('Please enter override justification'); return; }
    const updated = {
      ...candidate,
      ...Object.fromEntries(Object.keys(DIM).map(k=>[k,{...candidate[k],score:edits[k]}])),
      total_score:total, override_reason:reason, is_overridden:hasChanges||candidate.is_overridden
    };
    if (hasChanges) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      try { await fetch(`${API_BASE}/api/override`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({candidate_name:updated.candidate_name,override_reason:reason,new_total_score:total})}); } catch {}
    }
    onSave(updated);
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div style={{ width:44, height:44, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:400, fontSize:'1.2rem', fontFamily:'Georgia, serif', flexShrink:0 }}>
              {(candidate.candidate_name||'?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="serif-heading" style={{ fontSize:'1.4rem', fontWeight:400, marginBottom:4 }}>{candidate.candidate_name}</h2>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span className={`tag tag-${rc(candidate.recommendation)}`}>{candidate.recommendation}</span>
                {candidate.is_overridden && <span className="tag tag-override">Modified</span>}
              </div>
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Save Changes</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Rubric */}
          <div className="modal-rubric stagger">
            <p className="label">Detailed Score Breakdown</p>
            {Object.keys(DIM).map(k => {
              const orig = candidate[k] || { score:0, justification:'' };
              const changed = edits[k] !== orig.score;
              const color = getCatColor(edits[k]);
              const category = getCategory(edits[k]);
              const m = DIM[k];
              return (
                <div key={k} className="card" style={{ padding:'16px 20px', borderLeft:changed?`3px solid var(--violet)`:'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ color:'var(--ink-4)' }}>{m.icon}</div>
                      <span style={{ fontWeight:700, fontSize:'.9rem', color:'var(--ink-2)' }}>{m.label}</span>
                      <span style={{ fontSize:'.7rem', padding:'2px 8px', borderRadius:20, background:'var(--sand-100)', color:'var(--ink-4)', fontWeight:700 }}>
                        {Math.round(W[k]*100)}%
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:'.75rem', fontWeight:800, color, padding:'4px 10px', borderRadius:6, background:`${color}15`, whiteSpace:'nowrap' }}>{category}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <input type="number" min="0" max="10" value={edits[k]}
                          onChange={e=>setEdits(p=>({...p,[k]:Math.max(0,Math.min(10,+e.target.value))}))}
                          style={{ width:48, padding:'6px 8px', textAlign:'center', fontWeight:800, fontSize:'.9rem',
                            border:`1.5px solid ${changed?'var(--violet)':'var(--sand-200)'}`,
                            borderRadius:8, background:changed?'var(--violet-bg)':'#fff',
                            color, outline:'none', fontFamily:'inherit' }}
                        />
                        <span style={{ fontSize:'.75rem', color:'var(--ink-4)' }}>/10</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height:6, background:'var(--sand-100)', borderRadius:100, overflow:'hidden', marginBottom:12 }}>
                    <div style={{ height:'100%', width:`${edits[k]*10}%`, background:color, borderRadius:100, transition:'width .3s, background .3s' }} />
                  </div>
                  {orig.justification && (
                    <p style={{ fontSize:'.85rem', color:'var(--ink-3)', lineHeight:1.6, fontFamily:'Georgia, serif', fontStyle:'italic', background:'var(--violet-bg)', padding:'10px 14px', borderRadius:'0 8px 8px 0', borderLeft:'2px solid var(--violet)' }}>
                      "{orig.justification}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="modal-sidebar">
            <div style={{ padding:'24px 20px', textAlign:'center', borderBottom:'1px solid var(--sand-200)' }}>
              <Ring score={total} size={100} />
              <p style={{ fontSize:'.8rem', fontWeight:600, color:'var(--ink-3)', marginTop:12 }}>Composite Score</p>
            </div>
            <div style={{ padding:'16px 20px', flex:1, overflowY:'auto' }}>
              <p className="label" style={{ marginBottom:12 }}>Weight Breakdown</p>
              {Object.entries(DIM).map(([k,m])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--sand-100)' }}>
                  <span style={{ fontSize:'.8rem', color:'var(--ink-3)', display:'flex', alignItems:'center', gap:'6px' }}>
                    {m.icon} {m.label}
                  </span>
                  <span style={{ fontSize:'.8rem', fontWeight:700 }}>+{(edits[k]*W[k]).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {hasChanges && (
              <div style={{ padding:'14px 20px', background:'var(--amber-bg)', borderTop:'1px solid var(--amber)', borderRadius:'0 0 20px 0' }}>
                <p style={{ fontSize:'.75rem', fontWeight:700, color:'var(--amber)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <MessageSquare size={14} /> Audit Justification Required *
                </p>
                <textarea 
                  className="input-field" 
                  value={reason} 
                  onChange={e=>setReason(e.target.value)} 
                  placeholder="Explain why you are overriding the AI's assessment..." 
                  rows={3} 
                  style={{ fontSize:'.82rem', borderColor:'var(--amber)' }} 
                />
              </div>
            )}
            {candidate.is_overridden && !hasChanges && (
              <div style={{ padding:'14px 20px', background:'var(--sand-50)', borderTop:'1px solid var(--sand-200)' }}>
                <p style={{ fontSize:'.75rem', fontWeight:700, color:'var(--ink-4)', marginBottom:4 }}>Previous Override Note:</p>
                <p style={{ fontSize:'.82rem', color:'var(--ink-3)', fontStyle:'italic' }}>"{candidate.override_reason}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── RESULTS DASHBOARD ── */
const ResultsDashboard = ({ results: init, onReset }) => {
  const [candidates, setCandidates] = useState(init || []);
  const [selected, setSelected] = useState(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <p style={{ color:'var(--ink-4)', marginBottom:20 }}>No evaluation results found.</p>
        <button className="btn btn-ghost" onClick={onReset}>Go Back</button>
      </div>
    );
  }

  const save = (u) => {
    const next = candidates.map(c=>c.candidate_name===u.candidate_name?u:c).sort((a,b)=>b.total_score-a.total_score);
    setCandidates(next); setSelected(null);
  };

  const hired = candidates.filter(c=>c.recommendation==='Hire').length;
  const top = candidates[0];
  const rest = candidates.slice(1);

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div className="results-header">
        <div className="results-header-left">
          <h1>Evaluation Results</h1>
          <p>AI analyzed {candidates.length} profiles. Shortlist generated based on highest match scores.</p>
          <div className="results-legend">
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--rose)', flexShrink:0 }}/><strong>0</strong> – Poor</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--amber)', flexShrink:0 }}/><strong>5</strong> – Average</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--emerald)', flexShrink:0 }}/><strong>10</strong> – Excellent</span>
          </div>
        </div>
        <div className="results-actions">
          <button className="btn btn-ghost btn-sm" onClick={onReset} style={{ borderRadius:6 }}>
            <RotateCcw size={16} /> Start Over
          </button>
          <button className="btn btn-primary btn-sm" style={{ borderRadius:6 }}>
            Export Shortlist
          </button>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="stats-grid stagger">
        {[
          { label:'Total',      val:candidates.length,                                                  icon:<Users size={18} strokeWidth={1.5}/>,       color:'var(--ink)' },
          { label:'Shortlisted',val:hired,                                                              icon:<CheckCircle size={18} strokeWidth={1.5}/>,  color:'var(--emerald)' },
          { label:'Review',     val:candidates.filter(c=>c.recommendation==='Hold').length,             icon:<Clock size={18} strokeWidth={1.5}/>,        color:'var(--amber)' },
          { label:'Top Score',  val:(Math.max(...candidates.map(c=>c.total_score||0))).toFixed(1),     icon:<Trophy size={18} strokeWidth={1.5}/>,       color:'var(--violet)' },
        ].map((s,i)=>(
          <div key={i} className="card stat-card" style={{ borderLeft:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <span className="label">{s.label}</span>
              <div style={{ color:s.color }}>{s.icon}</div>
            </div>
            <span style={{ fontSize:'1.75rem', fontWeight:900, color:s.color, letterSpacing:'-.03em' }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Top Candidate */}
      {top && (
        <div className="top-candidate-card fade-up" onClick={()=>setSelected(top)}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Ring score={top.total_score||0} size={100} />
            <div style={{ position:'absolute', top:-6, left:-6, background:'#fbbf24', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color:'#b45309', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
              <Trophy size={14} strokeWidth={2.5} />
            </div>
          </div>
          <div className="top-candidate-info">
            <div className="top-candidate-title">
              <h2>{top.candidate_name}</h2>
              <span className={`tag tag-${rc(top.recommendation)}`}>{top.recommendation}</span>
              {top.is_overridden && <span className="tag tag-override">Edited</span>}
            </div>
            <p style={{ fontSize:'.9rem', color:'var(--ink-3)', marginBottom:16, fontFamily:'Georgia, serif', fontStyle:'italic' }}>
              Ranked #1 out of {candidates.length} candidates · Highest match score
            </p>
            {top.skills_match?.justification && (
              <div style={{ marginBottom:20, padding:'12px 16px', background:'var(--sand-50)', borderRadius:'8px', borderLeft:'2px solid var(--violet)' }}>
                <p style={{ fontSize:'.9rem', color:'var(--ink-3)', fontFamily:'Georgia, serif', fontStyle:'italic', lineHeight:1.5 }}>
                  "{top.skills_match.justification}"
                </p>
              </div>
            )}
            <DimBars candidate={top} />
          </div>
          <button className="btn btn-ghost" style={{ flexShrink:0, gap:'8px', borderRadius:'6px' }}>
            Inspect <Search size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Remaining Candidates */}
      {rest.length > 0 && (
        <div className="stagger" style={{ background:'#fff', border:'1px solid var(--sand-200)', borderRadius:'16px', overflow:'hidden', marginBottom:40 }}>
          {rest.map((c, idx) => {
            const i = idx + 1;
            const score = c.total_score || 0;
            const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
            const isLast = idx === rest.length - 1;
            return (
              <div key={i} className="candidate-list-item fade-up" onClick={()=>setSelected(c)}
                style={{ borderBottom: isLast ? 'none' : '1px solid var(--sand-200)' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--sand-50)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div className="candidate-list-left">
                  <div style={{ width:36, height:36, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:400, fontFamily:'Georgia, serif', fontSize:'1.1rem', flexShrink:0 }}>
                    {(c.candidate_name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <h3 className="serif-heading" style={{ fontSize:'1.05rem', fontWeight:400, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{c.candidate_name}</h3>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <span className={`tag tag-${rc(c.recommendation)}`}>{c.recommendation}</span>
                        {c.is_overridden && <span className="tag tag-override">Edited</span>}
                      </div>
                    </div>
                    {c.skills_match?.justification && (
                      <p style={{ fontSize:'.82rem', color:'var(--ink-4)', fontFamily:'Georgia, serif', fontStyle:'italic', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'360px', display:'none' }} className="desktop-only-text">
                        "{c.skills_match.justification}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="candidate-list-right">
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'.75rem', color:'var(--ink-4)' }}>Match</div>
                    <div><strong style={{ color:sc(score), fontSize:'1rem' }}>{score.toFixed(1)}</strong><span style={{ fontSize:'.75rem', color:'var(--ink-4)' }}>/10</span></div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ borderRadius:'6px' }}>Inspect</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <Modal candidate={selected} onClose={()=>setSelected(null)} onSave={save} />}
    </div>
  );
};

export default ResultsDashboard;

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Target, Briefcase, GraduationCap, FolderOpen, MessageSquare, Users, CheckCircle, Clock, Trophy, RotateCcw, Medal, Search } from 'lucide-react';

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

/* ── CATEGORY HELPER ── */
const getCategory = s => s > 7.5 ? 'Excellent' : s >= 4 ? 'Average' : 'Poor';
const getCatColor = s => s > 7.5 ? 'var(--emerald)' : s >= 4 ? 'var(--amber)' : 'var(--rose)';

/* ── MINI DIMENSION BARS (inside card) ── */
const DimBars = ({ candidate }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {Object.entries(DIM).map(([k, m]) => {
      const s = candidate[k]?.score ?? 0;
      const weight = Math.round(W[k] * 100);
      const category = getCategory(s);
      const color = getCatColor(s);
      
      return (
        <div key={k} style={{ display:'flex', flexDirection: 'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--ink-4)', display: 'flex' }}>{m.icon}</span>
              <span style={{ fontSize:'.75rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                {m.label} <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>(Weight: {weight}%)</span>
              </span>
            </div>
            <span style={{ fontSize:'.7rem', fontWeight:800, color, padding: '2px 8px', borderRadius: 6, background: `${color}15` }}>
              {category} · {s}/10
            </span>
          </div>
          <div className="mini-bar" style={{ flex:1, background: 'var(--sand-100)' }}>
            <div className="mini-bar-fill" style={{ width:`${s*10}%`, background: color }} />
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
    <div className="score-ring" style={{
      width:size, height:size,
      background:`conic-gradient(${color} ${score*10}%, var(--sand-100) 0)`,
      borderRadius:'50%'
    }}>
      <div className="score-ring-inner" style={{
        width:size-14, height:size-14,
        background: '#fff'
      }}>
        <span style={{ fontSize: size<80?'1.1rem':'1.4rem', fontWeight:900, color, letterSpacing:'-.03em', lineHeight:1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize:'.55rem', color: 'var(--ink-4)', fontWeight:700, marginTop:1 }}>/ 10</span>
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
    const updated = { ...candidate,
      ...Object.fromEntries(Object.keys(DIM).map(k=>[k,{...candidate[k],score:edits[k]}])),
      total_score:total, override_reason:reason, is_overridden:hasChanges||candidate.is_overridden };
    if (hasChanges) {
      try { await fetch('http://localhost:8000/api/override',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({candidate_name:updated.candidate_name,override_reason:reason,new_total_score:total})}); } catch {}
    }
    onSave(updated);
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop">
      <div className="modal fade-up">
        {/* Header */}
        <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--sand-200)', display:'flex', justifyContent:'space-between', alignItems:'center', background: '#F9F8F6' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:400, fontSize:'1.25rem', fontFamily: 'Georgia, serif' }}>
              {(candidate.candidate_name||'?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="serif-heading" style={{ fontSize:'1.5rem', fontWeight:400, marginBottom: 4 }}>{candidate.candidate_name}</h2>
              <div style={{ display:'flex', gap:6 }}>
                <span className={`tag tag-${rc(candidate.recommendation)}`}>{candidate.recommendation}</span>
                {candidate.is_overridden && <span className="tag tag-override">Modified</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '6px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={save} style={{ borderRadius: '6px' }}>Save Changes</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden', background: '#fff' }}>
          {/* Rubric list */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="label">Scoring Dimensions</p>
              <div style={{ display: 'flex', gap: 16, fontSize: '.75rem', color: 'var(--ink-4)' }}>
                <span><strong style={{color:'var(--rose)'}}>0</strong> – Poor</span>
                <span><strong style={{color:'var(--amber)'}}>5</strong> – Avg</span>
                <span><strong style={{color:'var(--emerald)'}}>10</strong> – Excel</span>
              </div>
            </div>
            {Object.entries(DIM).map(([k,m]) => {
              const orig = candidate[k] || {};
              const changed = edits[k] !== (orig.score||0);
              const category = getCategory(edits[k]);
              const color = getCatColor(edits[k]);
              
              return (
                <div key={k} className="card" style={{ padding:'16px 20px', borderLeft: changed ? `3px solid var(--violet)` : `1px solid var(--sand-200)` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ color: 'var(--ink-4)' }}>{m.icon}</div>
                      <span style={{ fontWeight:700, fontSize:'.9rem', color: 'var(--ink-2)' }}>{m.label}</span>
                      <span style={{ fontSize:'.7rem', padding:'2px 8px', borderRadius:20, background:'var(--sand-100)', color:'var(--ink-4)', fontWeight:700 }}>
                        Weight: {Math.round(W[k]*100)}%
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <span style={{ fontSize:'.75rem', fontWeight: 800, color, padding: '4px 10px', borderRadius: 6, background: `${color}15` }}>
                        {category}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <input type="number" min="0" max="10" value={edits[k]}
                          onChange={e=>setEdits(p=>({...p,[k]:Math.max(0,Math.min(10,+e.target.value))}))}
                          style={{ width:54, padding:'6px 8px', textAlign:'center', fontWeight:800, fontSize:'.95rem',
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
                    <p style={{ fontSize:'.85rem', color:'var(--ink-3)', lineHeight:1.6, paddingLeft:12, borderLeft:'2px solid var(--violet)', fontFamily: 'Georgia, serif', fontStyle: 'italic', background: 'var(--violet-bg)', padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>
                      "{orig.justification}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right panel */}
          <div style={{ width:280, borderLeft:'1px solid var(--sand-200)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'28px 20px', textAlign:'center', borderBottom:'1px solid var(--sand-200)' }}>
              <Ring score={total} size={110} />
              <p style={{ fontSize:'.8rem', fontWeight:600, color:'var(--ink-3)', marginTop:14 }}>Composite Score</p>
            </div>
            <div style={{ padding:'16px 20px', flex:1, overflowY:'auto' }}>
              <p className="label" style={{ marginBottom:12 }}>Breakdown</p>
              {Object.entries(DIM).map(([k,m])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--sand-100)' }}>
                  <span style={{ fontSize:'.8rem', color:'var(--ink-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.icon} {m.label}
                  </span>
                  <span style={{ fontSize:'.8rem', fontWeight:700 }}>+{(edits[k]*W[k]).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {hasChanges && (
              <div style={{ padding:'14px 20px', background:'var(--sand-50)', borderTop:'1px solid var(--sand-200)' }}>
                <p style={{ fontSize:'.75rem', fontWeight:700, color:'var(--amber)', marginBottom:8 }}>Override reason *</p>
                <textarea className="input-field" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why are you adjusting scores?" rows={3} style={{ fontSize:'.82rem' }} />
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
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--ink-4)', marginBottom: 20 }}>No evaluation results found.</p>
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
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, paddingBottom: 24, borderBottom: '1px solid var(--sand-200)' }}>
        <div>
          <h1 className="serif-heading" style={{ fontSize:'2.25rem', fontWeight:400, marginBottom:8 }}>Evaluation Results</h1>
          <p style={{ color:'var(--ink-4)', fontSize:'1.05rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>
            AI analyzed {candidates.length} profiles. Shortlist generated based on highest match scores.
          </p>
          <div style={{ display: 'flex', gap: 24, fontSize: '.85rem', color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--rose)' }}/> <strong>0</strong> – Poor</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--amber)' }}/> <strong>5</strong> – Average</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--emerald)' }}/> <strong>10</strong> – Excellent</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button className="btn btn-ghost" onClick={onReset} style={{ borderRadius: '6px', padding: '10px 20px' }}>
            <RotateCcw size={16} /> Start Over
          </button>
          <button className="btn btn-primary" style={{ borderRadius: '6px', padding: '10px 24px' }}>
            Export Shortlist
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          {label:'Total',val:candidates.length,icon: <Users size={18} strokeWidth={1.5} />,color:'var(--ink)'},
          {label:'Shortlisted',val:hired,icon: <CheckCircle size={18} strokeWidth={1.5} />,color:'var(--emerald)'},
          {label:'Review',val:candidates.filter(c=>c.recommendation==='Hold').length,icon: <Clock size={18} strokeWidth={1.5} />,color:'var(--amber)'},
          {label:'Top Score',val:(Math.max(...candidates.map(c=>c.total_score||0))).toFixed(1),icon: <Trophy size={18} strokeWidth={1.5} />,color:'var(--violet)'},
        ].map((s,i)=>(
          <div key={i} className="card" style={{ padding:'16px 18px', borderLeft:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <span className="label">{s.label}</span>
              <div style={{ color: s.color }}>{s.icon}</div>
            </div>
            <span style={{ fontSize:'1.75rem', fontWeight:900, color:s.color, letterSpacing:'-.03em' }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* TOP CANDIDATE — big feature card */}
      {top && (
        <div className="candidate-card fade-up" style={{ marginBottom:32, flexDirection:'row', alignItems:'center', gap:32, padding:'32px 40px', border: '1px solid var(--violet)', boxShadow: '0 4px 24px rgba(74,158,114,.08)', borderRadius: '16px', background: '#fff' }} onClick={()=>setSelected(top)}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Ring score={top.total_score||0} size={110} />
            <div style={{ position:'absolute', top:-6, left:-6, background:'#fbbf24', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color: '#b45309', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
              <Trophy size={14} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <h2 className="serif-heading" style={{ fontSize:'1.75rem', fontWeight:400, color:'var(--ink)' }}>{top.candidate_name}</h2>
              <span className={`tag tag-${rc(top.recommendation)}`}>{top.recommendation}</span>
              {top.is_overridden && <span className="tag" style={{ background:'var(--violet-bg)', color:'var(--violet)' }}>Edited</span>}
            </div>
            <p style={{ fontSize:'.9rem', color:'var(--ink-3)', marginBottom:16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Ranked #1 out of {candidates.length} candidates · Highest match score</p>
            
            {/* Justification highlight if available */}
            {top.skills_match?.justification && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--sand-50)', borderRadius: '8px', borderLeft: '2px solid var(--violet)' }}>
                <p style={{ fontSize: '.9rem', color: 'var(--ink-3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{top.skills_match.justification}"
                </p>
              </div>
            )}

            <DimBars candidate={top} />
          </div>
          <button className="btn btn-ghost" style={{ flexShrink:0, gap: '8px', borderRadius: '6px' }}>
            Inspect Profile <Search size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Remaining candidates grid */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {rest.map((c, idx) => {
          const i = idx + 1;
          const score = c.total_score || 0;
          const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
          const medalColor = i === 1 ? '#dbeafe' : i === 2 ? '#fce7f3' : 'var(--sand-100)';
          const medalIconColor = i === 1 ? '#1d4ed8' : i === 2 ? '#be185d' : 'var(--ink-4)';
          
          return (
            <div key={i} className="candidate-card fade-up" onClick={()=>setSelected(c)} style={{ padding: '24px', border: '1px solid var(--sand-200)', borderRadius: '16px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent: 'space-between', gap:12, marginBottom:16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:400, fontFamily: 'Georgia, serif', fontSize:'1.25rem', flexShrink:0 }}>
                    {(c.candidate_name||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="serif-heading" style={{ fontSize:'1.25rem', fontWeight:400, color:'var(--ink)' }}>{c.candidate_name}</h3>
                    <div style={{ display:'flex', gap:6, marginTop:4 }}>
                      <span className={`tag tag-${rc(c.recommendation)}`}>{c.recommendation}</span>
                      {c.is_overridden && <span className="tag" style={{ background:'var(--violet-bg)', color:'var(--violet)' }}>Edited</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div className="score-ring" style={{ width:40, height:40, background:`conic-gradient(${sc(score)} ${score*10}%, var(--sand-100) 0)` }}>
                    <div className="score-ring-inner" style={{ width:32, height:32, background: '#fff' }}>
                      <span style={{ fontSize:'.85rem', fontWeight:800, color:sc(score) }}>{score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification highlight if available */}
              {c.skills_match?.justification && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--sand-50)', borderRadius: '8px', borderLeft: '2px solid var(--violet)' }}>
                  <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{c.skills_match.justification}"
                  </p>
                </div>
              )}

              {/* Score */}
              <div style={{ flex: 1 }}>
                <DimBars candidate={c} />
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, marginTop: 16, borderTop:'1px solid var(--sand-100)' }}>
                {c.is_overridden && <span className="tag tag-override">Edited</span>}
                <span style={{ marginLeft:'auto', fontSize:'.78rem', fontWeight:600, color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Details <Search size={12} strokeWidth={2} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <Modal candidate={selected} onClose={()=>setSelected(null)} onSave={save} />}
    </div>
  );
};

export default ResultsDashboard;

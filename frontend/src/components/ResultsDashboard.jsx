import { Target, Briefcase, GraduationCap, FolderOpen, MessageSquare, Users, CheckCircle, Clock, Trophy, RotateCcw, Medal, Search } from 'lucide-react';

const W = { skills_match:.30, experience_relevance:.25, education_certs:.15, project_portfolio:.20, communication_quality:.10 };
const DIM = {
  skills_match:          { label:'Skills',        icon: <Target size={14} /> },
  experience_relevance:  { label:'Experience',    icon: <Briefcase size={14} /> },
  education_certs:       { label:'Education',     icon: <GraduationCap size={14} /> },
  project_portfolio:     { label:'Portfolio',     icon: <FolderOpen size={14} /> },
  communication_quality: { label:'Communication', icon: <MessageSquare size={14} /> },
};

const AVATAR_PALETTES = [
  ['#ede9fe','#5b21b6'],['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],
  ['#d1fae5','#065f46'],['#fef3c7','#92400e'],['#fee2e2','#991b1b'],
];

const sc = s => s >= 8 ? 'var(--emerald)' : s >= 5 ? 'var(--amber)' : 'var(--rose)';
const rc = r => r === 'Hire' ? 'hire' : r === 'No-Hire' ? 'nohire' : 'hold';

/* ── MINI DIMENSION BARS (inside card) ── */
const DimBars = ({ candidate, isDark }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    {Object.entries(DIM).map(([k, m]) => {
      const s = candidate[k]?.score ?? 0;
      return (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ color: isDark ? 'rgba(255,255,255,.45)' : 'var(--ink-4)', display: 'flex' }}>{m.icon}</div>
          <span style={{ fontSize:'.65rem', color: isDark ? 'rgba(255,255,255,.45)' : 'var(--ink-4)', width:66, flexShrink:0 }}>{m.label}</span>
          <div className="mini-bar" style={{ flex:1, background: isDark ? 'rgba(255,255,255,.1)' : 'var(--sand-100)' }}>
            <div className="mini-bar-fill" style={{ width:`${s*10}%`, background: sc(s) }} />
          </div>
          <span style={{ fontSize:'.65rem', fontWeight:700, color: isDark ? 'rgba(255,255,255,.7)' : 'var(--ink-3)', width:16, textAlign:'right' }}>{s}</span>
        </div>
      );
    })}
  </div>
);

/* ── SCORE RING ── */
const Ring = ({ score, size=90, isDark }) => {
  const color = sc(score);
  return (
    <div className="score-ring" style={{
      width:size, height:size,
      background:`conic-gradient(${color} ${score*10}%, ${isDark?'rgba(255,255,255,.07)':'var(--sand-100)'} 0)`,
      borderRadius:'50%'
    }}>
      <div className="score-ring-inner" style={{
        width:size-14, height:size-14,
        background: isDark ? '#1e1a2e' : '#fff'
      }}>
        <span style={{ fontSize: size<80?'1.1rem':'1.4rem', fontWeight:900, color, letterSpacing:'-.03em', lineHeight:1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize:'.55rem', color: isDark?'rgba(255,255,255,.4)':'var(--ink-4)', fontWeight:700, marginTop:1 }}>/ 10</span>
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
        <div style={{ padding:'20px 28px', borderBottom:'1px solid var(--sand-200)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1rem' }}>
              {(candidate.candidate_name||'?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1rem' }}>{candidate.candidate_name}</div>
              <div style={{ display:'flex', gap:6, marginTop:2 }}>
                <span className={`tag tag-${rc(candidate.recommendation)}`}>{candidate.recommendation}</span>
                {candidate.is_overridden && <span className="tag tag-override">Modified</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Save Changes</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Rubric list */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12, background:'var(--sand-50)' }}>
            <p className="label">Scoring Dimensions</p>
            {Object.entries(DIM).map(([k,m]) => {
              const orig = candidate[k] || {};
              const changed = edits[k] !== (orig.score||0);
              return (
                <div key={k} className="card" style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ color: 'var(--violet)' }}>{m.icon}</div>
                      <span style={{ fontWeight:600, fontSize:'.875rem' }}>{m.label}</span>
                      <span style={{ fontSize:'.7rem', padding:'2px 7px', borderRadius:20, background:'var(--sand-100)', color:'var(--ink-4)', fontWeight:700 }}>
                        {Math.round(W[k]*100)}%
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min="0" max="10" value={edits[k]}
                        onChange={e=>setEdits(p=>({...p,[k]:Math.max(0,Math.min(10,+e.target.value))}))}
                        style={{ width:48, padding:'5px 8px', textAlign:'center', fontWeight:800, fontSize:'.95rem',
                          border:`1.5px solid ${changed?'var(--violet)':'var(--sand-200)'}`,
                          borderRadius:8, background:changed?'var(--violet-bg)':'#fff',
                          color:sc(edits[k]), outline:'none', fontFamily:'inherit' }}
                      />
                      <span style={{ fontSize:'.75rem', color:'var(--ink-4)' }}>/10</span>
                    </div>
                  </div>
                  <div style={{ height:5, background:'var(--sand-100)', borderRadius:100, overflow:'hidden', marginBottom:10 }}>
                    <div style={{ height:'100%', width:`${edits[k]*10}%`, background:sc(edits[k]), borderRadius:100, transition:'width .5s' }} />
                  </div>
                  {orig.justification && (
                    <p style={{ fontSize:'.78rem', color:'var(--ink-3)', lineHeight:1.55, paddingLeft:10, borderLeft:'2px solid var(--sand-200)' }}>
                      {orig.justification}
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
  const [candidates, setCandidates] = useState(init);
  const [selected, setSelected] = useState(null);

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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <p className="label" style={{ marginBottom:6 }}>Evaluation Complete</p>
          <h1 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-.03em' }}>Candidate Shortlist</h1>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>
          <RotateCcw size={14} /> New Evaluation
        </button>
      </div>

      {/* Stat strip */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          {label:'Total',val:candidates.length,icon: <Users size={18} />,color:'var(--ink)'},
          {label:'Shortlisted',val:hired,icon: <CheckCircle size={18} />,color:'var(--emerald)'},
          {label:'Review',val:candidates.filter(c=>c.recommendation==='Hold').length,icon: <Clock size={18} />,color:'var(--amber)'},
          {label:'Top Score',val:(Math.max(...candidates.map(c=>c.total_score||0))).toFixed(1),icon: <Trophy size={18} />,color:'var(--violet)'},
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
        <div className="candidate-card top-card fade-up" style={{ marginBottom:20, flexDirection:'row', alignItems:'center', gap:28, padding:'28px 32px' }} onClick={()=>setSelected(top)}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Ring score={top.total_score||0} size={110} isDark />
            <div style={{ position:'absolute', top:-6, left:-6, background:'#fbbf24', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color: '#b45309', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
              <Trophy size={14} strokeWidth={3} />
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-.025em', color:'#fff' }}>{top.candidate_name}</h2>
              <span className={`tag tag-${rc(top.recommendation)}`} style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.15)' }}>{top.recommendation}</span>
              {top.is_overridden && <span className="tag" style={{ background:'rgba(91,76,219,.3)', color:'#c4bbff' }}>Edited</span>}
            </div>
            <p style={{ fontSize:'.85rem', color:'rgba(255,255,255,.5)', marginBottom:16 }}>Ranked #1 out of {candidates.length} candidates · Highest match score</p>
            <DimBars candidate={top} isDark />
          </div>
          <button className="btn" style={{ background:'rgba(255,255,255,.12)', color:'#fff', border:'1px solid rgba(255,255,255,.15)', flexShrink:0, gap: '8px' }}>
            Inspect Profile <Search size={16} />
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
            <div key={i} className="candidate-card" onClick={()=>setSelected(c)}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:pal[0], color:pal[1], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>
                  {(c.candidate_name||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.candidate_name}</div>
                  <span className={`tag tag-${rc(c.recommendation)}`} style={{ marginTop:2 }}>{c.recommendation}</span>
                </div>
                <div className="medal" style={{ background: medalColor, color: medalIconColor }}>
                  {i < 3 ? <Medal size={14} strokeWidth={3} /> : i + 1}
                </div>
              </div>

              {/* Score */}
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <Ring score={score} size={70} />
                <div style={{ flex:1 }}>
                  <DimBars candidate={c} isDark={false} />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:4, borderTop:'1px solid var(--sand-100)' }}>
                {c.is_overridden && <span className="tag tag-override">Edited</span>}
                <span style={{ marginLeft:'auto', fontSize:'.78rem', fontWeight:600, color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Details <Search size={12} />
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

export default ResultsDashboard;

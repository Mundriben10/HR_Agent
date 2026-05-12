import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trash2, Search, Calendar, User, ChevronRight, AlertCircle, FileText } from 'lucide-react';

const HistoryView = ({ onSelect }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        candidates (*)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching history:', error);
    else setEvaluations(data || []);
    setLoading(false);
  };

  const deleteEvaluation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this evaluation and all its candidate data?')) return;
    
    const { error } = await supabase.from('evaluations').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else setEvaluations(evaluations.filter(ev => ev.id !== id));
  };

  const filtered = evaluations.filter(ev => 
    (ev.title || 'Untitled Evaluation').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.candidates.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:100 }}><div className="spinner spinner-lg" /></div>;

  return (
    <div className="fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex-resp" style={{ marginBottom: 32 }}>
        <h1 className="serif-heading" style={{ fontSize: '2rem' }}>Past Evaluations</h1>
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search evaluations or candidates..." 
            style={{ paddingLeft: 36 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', background: 'transparent' }}>
          <div style={{ color: 'var(--sand-300)', marginBottom: 16 }}><FileText size={48} strokeWidth={1} /></div>
          <p style={{ color: 'var(--ink-4)' }}>{searchTerm ? 'No matches found.' : 'Your evaluation history will appear here.'}</p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gap: 16 }}>
          {filtered.map(ev => (
            <div 
              key={ev.id} 
              className="card" 
              onClick={() => onSelect(ev.candidates)}
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--violet)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sand-200)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--violet-bg)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{ev.title || 'Batch Evaluation'}</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: '.8rem', color: 'var(--ink-4)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {ev.candidates.length} candidates</span>
                    <span>{new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={(e) => deleteEvaluation(ev.id, e)} style={{ color: 'var(--rose)' }}>
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} color="var(--sand-300)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;

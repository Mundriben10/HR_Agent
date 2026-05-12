import React, { useState, useEffect } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryView from './components/HistoryView';
import { LayoutDashboard, Users, User, AlertCircle, Sparkles, LogIn, LogOut, History, Trash2 } from 'lucide-react';
import { supabase } from './supabase';

function App() {
  const [view, setView] = useState('dashboard');
  const [progress, setProgress] = useState(null);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
  };
  const logout = async () => { await supabase.auth.signOut(); setView('dashboard'); setResults(null); };

  const handleEvaluate = async (jdText, resumes, apiKey = '') => {
    setIsLoading(true); setError(null); setProgress(null); setCompletedFiles([]);
    const formData = new FormData();
    formData.append('jd_text', jdText);
    if (apiKey) formData.append('api_key', apiKey);
    Array.from(resumes).forEach(f => formData.append('resumes', f));
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${API_BASE}/api/evaluate`, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', finalResults = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            console.log('AI Event:', ev);
            if (ev.error) {
              throw new Error(ev.error);
            }
            if (ev.type === 'progress') {
              setProgress({ current: ev.current, total: ev.total, filename: ev.filename, step: ev.step });
              if (ev.step === 'done') setCompletedFiles(p => [...p, ev.filename]);
            } else if (ev.type === 'result') {
              console.log('Final Results Received:', ev.shortlist);
              finalResults = ev.shortlist;
            }
          } catch (e) {
            console.error('Failed to parse line or caught error:', e);
            throw e; // rethrow to be caught by the outer catch
          }
        }
      }
      
      if (buffer.trim()) {
        try {
          const ev = JSON.parse(buffer);
          console.log('Final AI Event (from buffer):', ev);
          if (ev.error) throw new Error(ev.error);
          if (ev.type === 'result') finalResults = ev.shortlist;
        } catch (e) {
          console.error('Failed to parse final buffer or caught error:', e);
          throw e;
        }
      }

      if (finalResults) {
        console.log('Switching to Results View...');
        setProgress(p => p ? { ...p, step: 'all_done' } : p);
        
        // AUTO-SAVE TO SUPABASE if user is logged in
        if (user) {
          try {
            const { data: evalData, error: evalErr } = await supabase
              .from('evaluations')
              .insert([{ 
                user_id: user.id, 
                jd_text: jdText, 
                title: jdText.substring(0, 40) + '...' 
              }])
              .select();
            
            if (evalData && !evalErr) {
              const candidateInserts = finalResults.map(c => ({
                evaluation_id: evalData[0].id,
                name: c.candidate_name,
                total_score: c.total_score,
                recommendation: c.recommendation,
                scores_json: c
              }));
              await supabase.from('candidates').insert(candidateInserts);
            }
          } catch (dbErr) {
            console.error('Database save error:', dbErr);
          }
        }

        await new Promise(r => setTimeout(r, 1000));
        setResults(finalResults); setView('results');
      } else {
        console.warn('Evaluation finished but no results were received.');
      }
    } catch (err) {
      console.error('Evaluation Error:', err);
      setError('Cannot reach backend. Make sure the FastAPI server is running on port 8000.');
    } finally { 
      setIsLoading(false); 
      setProgress(null); 
    }
  };

  const handleReset = () => { setResults(null); setError(null); setProgress(null); setCompletedFiles([]); setView('dashboard'); };

  return (
    <div className="app-shell">
      {/* Icon-only sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Sparkles size={18} strokeWidth={3} />
        </div>
        <div className="sidebar-sep" />

        <button 
          className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setView('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-label">New Evaluation</span>
        </button>

        {user && (
          <button 
            className={`nav-btn ${view === 'history' ? 'active' : ''}`} 
            onClick={() => setView('history')}
          >
            <History size={20} />
            <span className="nav-label">Records (History)</span>
          </button>
        )}

        <button
          className={`nav-btn ${view === 'results' ? 'active' : ''}`}
          onClick={() => results && setView('results')}
          style={{ opacity: results ? 1 : 0.35, cursor: results ? 'pointer' : 'not-allowed' }}
        >
          <Users size={20} />
          <span className="nav-label">Current Results</span>
          {results && <span className="dot" />}
        </button>

        <div className="sidebar-sep" />

        {user ? (
          <button className="nav-btn nav-btn-bottom" onClick={logout}>
            <LogOut size={20} />
            <span className="nav-label">Sign Out</span>
          </button>
        ) : (
          <button className="nav-btn nav-btn-bottom" onClick={login}>
            <LogIn size={20} />
            <span className="nav-label">HR Login</span>
          </button>
        )}
      </aside>

      {/* Content */}
      <div className="app-content">
        <header className="topbar">
          <span className="topbar-title">
            {view === 'results' ? `Evaluation Results · ${results?.length ?? 0} candidates` : 'New Evaluation'}
          </span>
          <div className="topbar-right">
            {error && (
              <span style={{ fontSize: '.8rem', color: 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Backend offline
              </span>
            )}
            <div className="status-pill">AI Ready</div>
          </div>
        </header>

        <main className="main-view">
          {view === 'dashboard' && <UploadSection onEvaluate={handleEvaluate} isLoading={isLoading} progress={progress} completedFiles={completedFiles} error={error} />}
          {view === 'results' && <ResultsDashboard results={results} onReset={handleReset} />}
          {view === 'history' && <HistoryView onSelect={(res) => { setResults(res.map(c => c.scores_json)); setView('results'); }} />}
        </main>
      </div>

      {/* MOBILE NAV (BOTTOM) */}
      <nav className="mobile-nav">
        <button 
          className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setView('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-label">Evaluate</span>
        </button>

        {user && (
          <button 
            className={`nav-btn ${view === 'history' ? 'active' : ''}`} 
            onClick={() => setView('history')}
          >
            <History size={20} />
            <span className="nav-label">Records</span>
          </button>
        )}

        {results && (
          <button 
            className={`nav-btn ${view === 'results' ? 'active' : ''}`} 
            onClick={() => setView('results')}
          >
            <Users size={20} />
            <span className="nav-label">Results</span>
          </button>
        )}

        {user ? (
          <button className="nav-btn" onClick={logout}>
            <LogOut size={20} />
            <span className="nav-label">Logout</span>
          </button>
        ) : (
          <button className="nav-btn" onClick={login}>
            <LogIn size={20} />
            <span className="nav-label">Login</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default App;

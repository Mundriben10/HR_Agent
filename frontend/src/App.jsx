import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import { LayoutDashboard, Users, User, AlertCircle, Sparkles } from 'lucide-react';

function App() {
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('dashboard');
  const [progress, setProgress] = useState(null);
  const [completedFiles, setCompletedFiles] = useState([]);

  const fetchHistory = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

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
        await new Promise(r => setTimeout(r, 1000));
        setResults(finalResults); setView('results');
        fetchHistory(); // Refresh history after new evaluation
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
          title="New Evaluation"
        >
          <LayoutDashboard size={20} />
        </button>
        <button
          className={`nav-btn ${view === 'results' ? 'active' : ''}`}
          onClick={() => results && setView('results')}
          style={{ opacity: results ? 1 : 0.35, cursor: results ? 'pointer' : 'not-allowed' }}
          title="Current Evaluation"
        >
          <Users size={20} />
          {results && <span className="dot" />}
        </button>
        <button
          className={`nav-btn ${view === 'history' ? 'active' : ''}`}
          onClick={() => { setView('history'); fetchHistory(); }}
          title="History Archive"
        >
          <Sparkles size={20} />
        </button>

        <button className="nav-btn nav-btn-bottom avatar-btn" title="HR Manager">
          <User size={16} />
        </button>
      </aside>

      {/* Content */}
      <div className="app-content">
        <header className="topbar">
          <span className="topbar-title">
            {view === 'results' ? `Current Results · ${results?.length ?? 0} candidates` : 
             view === 'history' ? `History Archive · ${history?.length ?? 0} total records` : 
             'New AI Evaluation'}
          </span>
          <div className="topbar-right">
            {error && (
              <span style={{ fontSize: '.8rem', color: 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Backend offline
              </span>
            )}
            <div className="status-pill">DB Persistent</div>
          </div>
        </header>

        <main className="main-view">
          {view === 'dashboard' && <UploadSection onEvaluate={handleEvaluate} isLoading={isLoading} progress={progress} completedFiles={completedFiles} error={error} />}
          {view === 'results' && <ResultsDashboard results={results} onReset={handleReset} />}
          {view === 'history' && <ResultsDashboard results={history} onReset={handleReset} isHistoryView={true} />}
        </main>
      </div>

      {/* Mobile navigation bar */}
      <nav className="mobile-nav mobile-only">
        <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <LayoutDashboard size={20} strokeWidth={1.5} />
        </button>
        <button className={`nav-btn ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); fetchHistory(); }}>
          <Sparkles size={20} strokeWidth={1.5} />
        </button>
        <button className={`nav-btn ${view === 'results' ? 'active' : ''}`} onClick={() => results && setView('results')} disabled={!results}>
          <Users size={20} strokeWidth={1.5} />
        </button>
      </nav>
    </div>
  );
}

export default App;

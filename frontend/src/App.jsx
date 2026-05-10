import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('dashboard');
  const [progress, setProgress] = useState(null);
  const [completedFiles, setCompletedFiles] = useState([]);

  const handleEvaluate = async (jdText, resumes) => {
    setIsLoading(true); setError(null); setProgress(null); setCompletedFiles([]);
    const formData = new FormData();
    formData.append('jd_text', jdText);
    Array.from(resumes).forEach(f => formData.append('resumes', f));
    try {
      const response = await fetch('http://localhost:8000/api/evaluate', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', finalResults = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === 'progress') {
              setProgress({ current: ev.current, total: ev.total, filename: ev.filename, step: ev.step });
              if (ev.step === 'done') setCompletedFiles(p => [...p, ev.filename]);
            } else if (ev.type === 'result') finalResults = ev.shortlist;
          } catch {}
        }
      }
      if (finalResults) {
        setProgress(p => p ? { ...p, step: 'all_done' } : p);
        await new Promise(r => setTimeout(r, 1000));
        setResults(finalResults); setView('results');
      }
    } catch (err) {
      setError('Cannot reach backend. Make sure the FastAPI server is running on port 8000.');
    } finally { setIsLoading(false); setProgress(null); }
  };

  const handleReset = () => { setResults(null); setError(null); setProgress(null); setCompletedFiles([]); setView('dashboard'); };

  const IconGrid = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );

  const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  return (
    <div className="app-shell">
      {/* Icon-only sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">N</div>
        <div className="sidebar-sep" />

        <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')} title="Dashboard">
          <IconGrid />
        </button>
        <button
          className={`nav-btn ${view === 'results' ? 'active' : ''}`}
          onClick={() => results && setView('results')}
          style={{ opacity: results ? 1 : 0.35, cursor: results ? 'pointer' : 'not-allowed' }}
          title="Evaluations"
        >
          <IconUsers />
          {results && <span className="dot" />}
        </button>

        <button className="nav-btn nav-btn-bottom avatar-btn" title="HR Manager">HR</button>
      </aside>

      {/* Content */}
      <div className="app-content">
        <header className="topbar">
          <span className="topbar-title">
            {view === 'results' ? `Evaluation Results · ${results?.length ?? 0} candidates` : 'New Evaluation'}
          </span>
          <div className="topbar-right">
            {error && (
              <span style={{ fontSize: '.8rem', color: 'var(--rose)', fontWeight: 600 }}>⚠ Backend offline</span>
            )}
            <div className="status-pill">AI Ready</div>
          </div>
        </header>

        <main className="main-view">
          {view === 'dashboard'
            ? <UploadSection onEvaluate={handleEvaluate} isLoading={isLoading} progress={progress} completedFiles={completedFiles} error={error} />
            : <ResultsDashboard results={results} onReset={handleReset} />}
        </main>
      </div>
    </div>
  );
}

export default App;

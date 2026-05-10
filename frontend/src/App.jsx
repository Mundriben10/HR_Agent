import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'results'
  
  // Real-time progress from backend stream
  const [progress, setProgress] = useState(null);
  const [completedFiles, setCompletedFiles] = useState([]);

  const handleEvaluate = async (jdText, resumes) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);
    setCompletedFiles([]);

    const formData = new FormData();
    formData.append('jd_text', jdText);
    Array.from(resumes).forEach(file => {
      formData.append('resumes', file);
    });

    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResults = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setProgress({ current: event.current, total: event.total, filename: event.filename, step: event.step });
              if (event.step === 'done') setCompletedFiles(prev => [...prev, event.filename]);
            } else if (event.type === 'result') {
              finalResults = event.shortlist;
            }
          } catch (e) {}
        }
      }

      if (finalResults) {
        setProgress(prev => prev ? { ...prev, step: 'all_done' } : prev);
        await new Promise(r => setTimeout(r, 1200));
        setResults(finalResults);
        setView('results');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend. Please ensure the FastAPI server is running on port 8000.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setProgress(null);
    setCompletedFiles([]);
    setView('dashboard');
  };

  return (
    <div className="sidebar-layout">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">N</div>
          <div className="sidebar-logo-text">Nexus<span>HR</span></div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Workspace</p>
          <div
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Dashboard</span>
          </div>
          <div
            className={`nav-item ${view === 'results' ? 'active' : ''}`}
            onClick={() => results && setView('results')}
            style={{ opacity: results ? 1 : 0.38, cursor: results ? 'pointer' : 'not-allowed' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Evaluations</span>
            {results && (
              <span style={{ marginLeft: 'auto', background: 'var(--brand)', color: '#fff',
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>
                {results.length}
              </span>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">HR</div>
            <div>
              <div className="user-name">HR Manager</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="content-topbar">
          <div className="topbar-breadcrumb">
            <span>NexusHR</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span>{view === 'results' ? 'Evaluation Results' : 'New Evaluation'}</span>
          </div>
          <div className="topbar-badge">AI-Powered Intelligence</div>
        </header>

        <main className="app-main-viewport">
          {error && (
            <div className="glass animate-fade-up" style={{
              padding: '14px 18px', marginBottom: '24px',
              borderLeft: '3px solid var(--danger)',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--danger-bg)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {view === 'dashboard' ? (
            <UploadSection
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
              progress={progress}
              completedFiles={completedFiles}
            />
          ) : (
            <ResultsDashboard results={results} onReset={handleReset} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import { LayoutDashboard, Users, User, AlertCircle, Sparkles } from 'lucide-react';

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
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            console.log('AI Event:', ev);
            if (ev.type === 'progress') {
              setProgress({ current: ev.current, total: ev.total, filename: ev.filename, step: ev.step });
              if (ev.step === 'done') setCompletedFiles(p => [...p, ev.filename]);
            } else if (ev.type === 'result') {
              console.log('Final Results Received:', ev.shortlist);
              finalResults = ev.shortlist;
            }
          } catch (e) {
            console.error('Failed to parse line:', line, e);
          }
        }
      }
      
      if (buffer.trim()) {
        try {
          const ev = JSON.parse(buffer);
          console.log('Final AI Event (from buffer):', ev);
          if (ev.type === 'result') finalResults = ev.shortlist;
        } catch (e) {
          console.error('Failed to parse final buffer:', buffer, e);
        }
      }

      if (finalResults) {
        console.log('Switching to Results View...');
        setProgress(p => p ? { ...p, step: 'all_done' } : p);
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
          title="Dashboard"
        >
          <LayoutDashboard size={20} />
        </button>
        <button
          className={`nav-btn ${view === 'results' ? 'active' : ''}`}
          onClick={() => results && setView('results')}
          style={{ opacity: results ? 1 : 0.35, cursor: results ? 'pointer' : 'not-allowed' }}
          title="Evaluations"
        >
          <Users size={20} />
          {results && <span className="dot" />}
        </button>

        <button className="nav-btn nav-btn-bottom avatar-btn" title="HR Manager">
          <User size={16} />
        </button>
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
          {view === 'dashboard'
            ? <UploadSection onEvaluate={handleEvaluate} isLoading={isLoading} progress={progress} completedFiles={completedFiles} error={error} />
            : <ResultsDashboard results={results} onReset={handleReset} />}
        </main>
      </div>
    </div>
  );
}

export default App;

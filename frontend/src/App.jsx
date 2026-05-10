import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluate = async (jdText, resumes) => {
    setIsLoading(true);
    setError(null);
    
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

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
         setError(data.error);
      } else {
         setResults(data.shortlist);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the evaluation server. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <h1>Nexus HR Intelligence</h1>
        <p>AI-Powered Candidate Shortlisting Engine</p>
      </header>

      <main>
        {error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid var(--accent-danger)' }}>
             <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
          </div>
        )}

        {!results ? (
          <UploadSection onEvaluate={handleEvaluate} isLoading={isLoading} />
        ) : (
          <ResultsDashboard results={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;

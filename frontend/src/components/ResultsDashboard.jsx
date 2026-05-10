import React, { useState } from 'react';

const ScoreBar = ({ score }) => {
  const width = `${score * 10}%`;
  let color = 'var(--accent-danger)';
  if (score >= 8) color = 'var(--accent-success)';
  else if (score >= 5) color = 'var(--accent-warning)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width, background: color, borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
      </div>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, width: '40px', textAlign: 'right' }}>{score}/10</span>
    </div>
  );
};

const CandidateModal = ({ candidate, onClose, onSave }) => {
  // Local state for edits
  const [edits, setEdits] = useState({
    skills_match: { score: candidate.skills_match?.score || 0 },
    experience_relevance: { score: candidate.experience_relevance?.score || 0 },
    education_certs: { score: candidate.education_certs?.score || 0 },
    project_portfolio: { score: candidate.project_portfolio?.score || 0 },
    communication_quality: { score: candidate.communication_quality?.score || 0 },
  });
  const [overrideReason, setOverrideReason] = useState(candidate.override_reason || "");

  const hasChanges = Object.keys(edits).some(key => edits[key].score !== (candidate[key]?.score || 0));

  const handleScoreChange = (dim, value) => {
    const val = Math.max(0, Math.min(10, Number(value)));
    setEdits(prev => ({ ...prev, [dim]: { ...prev[dim], score: val } }));
  };

  const handleSave = async () => {
    if (hasChanges && !overrideReason) {
      alert("You must provide an override reason to change scores.");
      return;
    }
    
    // Calculate new total score
    const total = 
      (edits.skills_match.score * 0.30) +
      (edits.experience_relevance.score * 0.25) +
      (edits.education_certs.score * 0.15) +
      (edits.project_portfolio.score * 0.20) +
      (edits.communication_quality.score * 0.10);

    const updatedCandidate = {
      ...candidate,
      skills_match: { ...candidate.skills_match, score: edits.skills_match.score },
      experience_relevance: { ...candidate.experience_relevance, score: edits.experience_relevance.score },
      education_certs: { ...candidate.education_certs, score: edits.education_certs.score },
      project_portfolio: { ...candidate.project_portfolio, score: edits.project_portfolio.score },
      communication_quality: { ...candidate.communication_quality, score: edits.communication_quality.score },
      total_score: total,
      override_reason: overrideReason,
      is_overridden: hasChanges || candidate.is_overridden
    };

    // Physically log the override to the backend if there are changes
    if (hasChanges) {
      try {
        await fetch('http://localhost:8000/api/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_name: updatedCandidate.candidate_name,
            override_reason: overrideReason,
            new_total_score: total
          })
        });
        alert("HR Override physically logged to the server!");
      } catch (err) {
        console.error("Failed to log override to server", err);
      }
    }

    onSave(updatedCandidate);
  };

  const dimensions = [
    { key: 'skills_match', label: 'Skills Match (30%)' },
    { key: 'experience_relevance', label: 'Experience Relevance (25%)' },
    { key: 'education_certs', label: 'Education & Certs (15%)' },
    { key: 'project_portfolio', label: 'Project / Portfolio (20%)' },
    { key: 'communication_quality', label: 'Communication Quality (10%)' }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
      overflowY: 'auto', padding: '40px 20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', maxWidth: '800px', margin: 'auto', position: 'relative',
        padding: '32px'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{candidate.candidate_name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Transparent Scoring Rubric & Override</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {dimensions.map(dim => {
            const originalData = candidate[dim.key] || { score: 0, justification: 'N/A' };
            const currentScore = edits[dim.key].score;
            
            return (
              <div key={dim.key} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 500 }}>{dim.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score:</span>
                    <input 
                      type="number" 
                      min="0" max="10" 
                      value={currentScore}
                      onChange={(e) => handleScoreChange(dim.key, e.target.value)}
                      style={{ 
                        width: '60px', padding: '4px 8px', borderRadius: '4px', 
                        background: 'rgba(0,0,0,0.4)', border: '1px solid var(--panel-border)', 
                        color: 'white', fontFamily: 'inherit', textAlign: 'center' 
                      }}
                    />
                  </div>
                </div>
                <ScoreBar score={currentScore} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>AI Justification:</strong> "{originalData.justification}"
                </p>
              </div>
            )
          })}
        </div>

        {/* Override Section */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--panel-border)' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: hasChanges ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
            HR Override Reason {hasChanges && "(Required)"}
          </label>
          <textarea 
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="If you changed any scores, explain why here..."
            style={{
              width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px',
              background: 'rgba(0,0,0,0.2)', border: hasChanges && !overrideReason ? '1px solid var(--accent-danger)' : '1px solid var(--panel-border)',
              color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
          <button onClick={onClose} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--panel-border)', boxShadow: 'none' }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const ResultsDashboard = ({ results: initialResults, onReset }) => {
  const [candidates, setCandidates] = useState(initialResults);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleSaveCandidate = (updatedCandidate) => {
    const newCandidates = candidates.map(c => c.candidate_name === updatedCandidate.candidate_name ? updatedCandidate : c);
    // Re-sort in case total score changed
    newCandidates.sort((a, b) => b.total_score - a.total_score);
    setCandidates(newCandidates);
    setSelectedCandidate(null);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Ranked Shortlist</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Evaluated {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onReset} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--panel-border)', boxShadow: 'none' }}>
          New Evaluation
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--panel-border)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rank</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Candidate Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Match</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Recommendation</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => {
              const displayScore = candidate.total_score ? candidate.total_score.toFixed(1) : '0.0';
              let recColor = 'var(--text-secondary)';
              if (candidate.recommendation === 'Hire') recColor = 'var(--accent-success)';
              if (candidate.recommendation === 'No-Hire') recColor = 'var(--accent-danger)';
              if (candidate.recommendation === 'Hold') recColor = 'var(--accent-warning)';

              return (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                  <td style={{ padding: '16px 24px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>#{index + 1}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                    {candidate.candidate_name}
                    {candidate.is_overridden && (
                      <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', background: 'var(--accent-warning)', color: '#000', borderRadius: '4px', fontWeight: 700 }}>HR Edited</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-primary)', width: '35px' }}>{displayScore}</div>
                      <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${candidate.total_score * 10}%`, background: 'var(--accent-primary)', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                      background: `color-mix(in srgb, ${recColor} 20%, transparent)`, color: recColor, border: `1px solid color-mix(in srgb, ${recColor} 40%, transparent)`
                    }}>
                      {candidate.recommendation || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedCandidate(candidate)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    >
                      View / Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedCandidate && (
        <CandidateModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
          onSave={handleSaveCandidate} 
        />
      )}
    </div>
  );
};

export default ResultsDashboard;

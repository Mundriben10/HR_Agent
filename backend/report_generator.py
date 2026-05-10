import json
import os
from jinja2 import Template
from datetime import datetime

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HR Shortlist Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .candidate { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .candidate-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .candidate-header h2 { margin: 0; color: #1e293b; }
        .score-badge { font-size: 1.2rem; font-weight: bold; color: #3b82f6; }
        .rec-hire { color: #10b981; font-weight: bold; }
        .rec-nohire { color: #ef4444; font-weight: bold; }
        .rec-hold { color: #f59e0b; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
        th { color: #64748b; font-weight: 500; }
    </style>
</head>
<body>
    <h1>HR Shortlist Report</h1>
    <p>Generated on: {{ timestamp }}</p>

    {% for c in candidates %}
    <div class="candidate">
        <div class="candidate-header">
            <div>
                <h2>#{{ loop.index }} - {{ c.candidate_name }}</h2>
                <span class="{% if c.recommendation == 'Hire' %}rec-hire{% elif c.recommendation == 'No-Hire' %}rec-nohire{% else %}rec-hold{% endif %}">
                    Recommendation: {{ c.recommendation }}
                </span>
            </div>
            <div class="score-badge">Total: {{ "%.1f"|format(c.total_score) }}/10</div>
        </div>
        
        <table>
            <tr>
                <th width="25%">Dimension</th>
                <th width="10%">Score</th>
                <th>AI Justification</th>
            </tr>
            <tr>
                <td>Skills Match (30%)</td>
                <td><strong>{{ c.skills_match.score }}/10</strong></td>
                <td>{{ c.skills_match.justification }}</td>
            </tr>
            <tr>
                <td>Experience (25%)</td>
                <td><strong>{{ c.experience_relevance.score }}/10</strong></td>
                <td>{{ c.experience_relevance.justification }}</td>
            </tr>
            <tr>
                <td>Education & Certs (15%)</td>
                <td><strong>{{ c.education_certs.score }}/10</strong></td>
                <td>{{ c.education_certs.justification }}</td>
            </tr>
            <tr>
                <td>Project / Portfolio (20%)</td>
                <td><strong>{{ c.project_portfolio.score }}/10</strong></td>
                <td>{{ c.project_portfolio.justification }}</td>
            </tr>
            <tr>
                <td>Communication (10%)</td>
                <td><strong>{{ c.communication_quality.score }}/10</strong></td>
                <td>{{ c.communication_quality.justification }}</td>
            </tr>
        </table>
    </div>
    {% endfor %}
</body>
</html>
"""

def generate_reports(results: list):
    """Generates and saves HTML and JSON reports to disk."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Generate JSON
    with open("shortlist_report.json", "w") as f:
        json.dump({
            "timestamp": timestamp,
            "shortlist": results
        }, f, indent=2)
        
    # Generate HTML
    template = Template(HTML_TEMPLATE)
    html_content = template.render(candidates=results, timestamp=timestamp)
    with open("shortlist_report.html", "w") as f:
        f.write(html_content)
        
    print(f"Reports saved to shortlist_report.json and shortlist_report.html")

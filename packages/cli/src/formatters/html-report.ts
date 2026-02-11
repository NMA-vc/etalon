import type { AuditReport, ComplianceGrade } from '@etalon/core';

// ─── HTML Report Generator ────────────────────────────────────────

const GRADE_COLORS: Record<ComplianceGrade, string> = {
    A: '#4caf50', B: '#8bc34a', C: '#ff9800', D: '#ff5722', F: '#f44336',
};

const SEV_COLORS: Record<string, string> = {
    critical: '#f44336', high: '#ff5722', medium: '#ff9800', low: '#4caf50', info: '#90a4ae',
};

/**
 * Generate a self-contained HTML dashboard report.
 */
export function generateHtmlReport(report: AuditReport): string {
    const score = report.score;
    const grade = score?.grade ?? 'F';
    const gradeColor = GRADE_COLORS[grade];
    const scoreNum = score?.score ?? 0;

    const findingRows = report.findings.map(f => {
        const gdpr = f.gdprArticles?.map(a => `<a href="${a.url}" target="_blank" title="${a.title}">Art. ${a.article}</a>`).join(', ') ?? '';
        return `<tr data-severity="${f.severity}" data-category="${f.category}">
            <td><span class="sev-badge" style="background:${SEV_COLORS[f.severity]}">${f.severity}</span></td>
            <td>${esc(f.title)}</td>
            <td><code>${esc(f.file)}${f.line ? `:${f.line}` : ''}</code></td>
            <td>${esc(f.rule)}</td>
            <td class="gdpr-col">${gdpr}</td>
            <td>${f.fix ? esc(f.fix) : ''}</td>
        </tr>`;
    }).join('\n');

    const sevChart = ['critical', 'high', 'medium', 'low', 'info'].map(s => {
        const count = report.summary[s as keyof typeof report.summary] as number;
        return count > 0 ? `<div class="bar" style="flex:${count};background:${SEV_COLORS[s]}" title="${s}: ${count}">${count}</div>` : '';
    }).join('');

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ETALON Privacy Audit Report</title>
<style>
:root { --bg: #0d1117; --card: #161b22; --border: #30363d; --text: #c9d1d9; --text-dim: #8b949e; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background:var(--bg); color:var(--text); padding:2rem; line-height:1.6; }
.container { max-width:1200px; margin:0 auto; }
h1 { font-size:1.8rem; margin-bottom:.5rem; }
h2 { font-size:1.2rem; margin:1.5rem 0 .75rem; color:var(--text); }
.subtitle { color:var(--text-dim); margin-bottom:2rem; }
.grid { display:grid; grid-template-columns:200px 1fr; gap:1.5rem; margin-bottom:2rem; }
.score-ring { width:180px; height:180px; position:relative; margin:0 auto; }
.score-ring svg { transform:rotate(-90deg); }
.score-ring .label { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.score-ring .grade { font-size:3rem; font-weight:700; color:${gradeColor}; }
.score-ring .num { font-size:1rem; color:var(--text-dim); }
.card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:1.25rem; }
.meta-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.75rem; }
.meta-item { font-size:.85rem; }
.meta-item span { display:block; color:var(--text-dim); font-size:.75rem; }
.bar-chart { display:flex; border-radius:4px; overflow:hidden; height:28px; margin:1rem 0; }
.bar { color:#fff; font-size:.75rem; display:flex; align-items:center; justify-content:center; font-weight:600; min-width:28px; }
table { width:100%; border-collapse:collapse; font-size:.85rem; }
th { text-align:left; padding:.6rem .75rem; border-bottom:2px solid var(--border); color:var(--text-dim); font-weight:600; position:sticky; top:0; background:var(--card); }
td { padding:.5rem .75rem; border-bottom:1px solid var(--border); vertical-align:top; }
tr:hover { background:#1c2128; }
code { background:#1c2128; padding:.15rem .4rem; border-radius:3px; font-size:.8rem; }
a { color:#58a6ff; text-decoration:none; }
a:hover { text-decoration:underline; }
.sev-badge { color:#fff; padding:2px 8px; border-radius:3px; font-size:.75rem; font-weight:600; text-transform:uppercase; }
.filters { display:flex; gap:.5rem; margin-bottom:1rem; flex-wrap:wrap; }
.filters button { background:var(--card); border:1px solid var(--border); color:var(--text); padding:.35rem .75rem; border-radius:4px; cursor:pointer; font-size:.8rem; }
.filters button.active { background:#1f6feb; border-color:#1f6feb; color:#fff; }
.gdpr-col { font-size:.8rem; }
.footer { text-align:center; color:var(--text-dim); font-size:.8rem; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border); }
@media print { body { background:#fff; color:#000; } .card { border-color:#ddd; } }
@media (max-width:768px) { .grid { grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="container">
<h1>🛡️ ETALON Privacy Audit Report</h1>
<p class="subtitle">Generated ${new Date(report.meta.auditDate).toLocaleString()} • ${report.meta.directory}</p>

<div class="grid">
  <div class="card" style="display:flex;align-items:center;justify-content:center">
    <div class="score-ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="78" stroke="var(--border)" stroke-width="12" fill="none"/>
        <circle cx="90" cy="90" r="78" stroke="${gradeColor}" stroke-width="12" fill="none"
          stroke-dasharray="${(scoreNum / 100) * 490} 490" stroke-linecap="round"/>
      </svg>
      <div class="label">
        <div class="grade">${grade}</div>
        <div class="num">${scoreNum}/100</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Summary</h2>
    <div class="meta-grid">
      <div class="meta-item"><span>Total Findings</span>${report.summary.totalFindings}</div>
      <div class="meta-item"><span>Tracker SDKs</span>${report.summary.trackerSdksFound}</div>
      <div class="meta-item"><span>PII Columns</span>${report.summary.piiColumnsFound}</div>
      <div class="meta-item"><span>Config Issues</span>${report.summary.configIssues}</div>
      <div class="meta-item"><span>Stack</span>${report.meta.stack.languages.join(', ')} / ${report.meta.stack.framework}</div>
      <div class="meta-item"><span>Duration</span>${(report.meta.auditDurationMs / 1000).toFixed(1)}s</div>
    </div>
    <div class="bar-chart">${sevChart || '<div style="flex:1;background:var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:.8rem">No findings</div>'}</div>
  </div>
</div>

${report.findings.length > 0 ? `
<div class="card">
<h2 style="margin-top:0">Findings (${report.findings.length})</h2>
<div class="filters">
  <button class="active" onclick="filterTable('all')">All</button>
  <button onclick="filterTable('critical')">Critical</button>
  <button onclick="filterTable('high')">High</button>
  <button onclick="filterTable('medium')">Medium</button>
  <button onclick="filterTable('low')">Low</button>
</div>
<div style="overflow-x:auto">
<table id="findings-table">
<thead><tr><th>Severity</th><th>Title</th><th>File</th><th>Rule</th><th>GDPR</th><th>Fix</th></tr></thead>
<tbody>${findingRows}</tbody>
</table>
</div>
</div>` : ''}

${report.recommendations.length > 0 ? `
<div class="card" style="margin-top:1.5rem">
<h2 style="margin-top:0">💡 Recommendations</h2>
<ol style="padding-left:1.25rem">${report.recommendations.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
</div>` : ''}

<div class="footer">
  Generated by <a href="https://etalon.nma.vc">ETALON</a> v${report.meta.etalonVersion} •
  <a href="https://etalon.nma.vc/docs">Documentation</a>
</div>
</div>

<script>
function filterTable(sev) {
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('#findings-table tbody tr').forEach(row => {
    row.style.display = (sev === 'all' || row.dataset.severity === sev) ? '' : 'none';
  });
}
</script>
</body>
</html>`;
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

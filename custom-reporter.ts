import { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

class MyCustomReporter implements Reporter {
  // Keyed by test id so retries overwrite earlier attempts (one row per test,
  // reflecting the final attempt) rather than producing duplicate rows.
  private results = new Map<string, any>();

  // Spec file -> human-friendly feature area, so the "Area" sub-label is always
  // meaningful even when a test has no describe block.
  private static readonly SPEC_FEATURE: Record<string, string> = {
    'validation.spec.ts': 'Login & Search Validation',
    'website-search-filters.spec.ts': 'Website Search',
    'system-check.spec.ts': 'System Check',
    'navigation.spec.ts': 'Sidebar Navigation',
    'matrix.spec.ts': 'Location / Brand Matrix',
    'website-analysis.spec.ts': 'Website Analysis',
    'stage-full.spec.ts': 'Stage',
    'duplicate-check.spec.ts': 'Duplicate Check',
    'auth.setup.ts': 'Authentication',
  };

  onTestEnd(test: TestCase, result: TestResult) {
    const rawMessage = result.error?.message || '';
    const cleanReason = rawMessage.replace(/\u001b\[\d+m/g, '') || (result.status === 'passed' ? 'Passed' : '—');
    // The latest 'url' annotation: specs record the route they exercised.
    const testUrl = [...test.annotations].reverse().find(a => a.type === 'url')?.description || '';

    // Find screenshot
    const screenshotAttachment = result.attachments.find(a => a.name === 'screenshot');
    let screenshotBase64 = '';
    
    if (screenshotAttachment?.path && fs.existsSync(screenshotAttachment.path)) {
      screenshotBase64 = fs.readFileSync(screenshotAttachment.path).toString('base64');
    }

    const titlePath = test.titlePath();
    const fileIdx = titlePath.findIndex(t => t.includes('.spec.') || t.endsWith('.ts'));
    const describes = fileIdx >= 0 ? titlePath.slice(fileIdx + 1, -1).filter(Boolean) : [];
    const leaf = test.title;
    const specFile = path.basename(test.location?.file || 'unknown');

    // Page (subject under test) + Area (higher-level feature/group).
    // System-check titles look like "[Group] Module" -> Page=Module, Area=Group.
    const bracket = leaf.match(/^\[([^\]]+)\]\s*(.+)$/);
    const feature = MyCustomReporter.SPEC_FEATURE[specFile] || specFile.replace(/\.(spec|setup)\.ts$/, '');
    const page = bracket ? bracket[2].trim() : (describes[0] || feature);
    const area = bracket ? bracket[1].trim() : feature;
    // Scenario shown in the Test Name column (avoid repeating the Page value).
    const scenario = bracket ? (describes.join(' › ') || 'module health checks') : leaf;

    // Positive / Negative / Functional, inferred from common test naming.
    const kind = /\b(negative|invalid|error|reject|fail|no results|empty|whitespace|blocked|wrong|unknown)\b/i.test(leaf)
      ? 'Negative'
      : /\b(positive|valid|success|enable|render|load|present|works?|functional|reachable)\b/i.test(leaf)
        ? 'Positive'
        : 'Functional';

    const started = result.startTime
      ? new Date(result.startTime).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      : 'N/A';

    this.results.set(test.id, {
      page,
      area,
      scenario,
      kind,
      specFile,
      url: testUrl,
      status: result.status,
      reason: cleanReason,
      screenshot: screenshotBase64,
      duration: (result.duration / 1000).toFixed(2), // in seconds
      started,
      retry: result.retry,                 // retries used to reach this result
      flaky: test.outcome() === 'flaky',   // passed only after one or more retries
    });
  }

  async onEnd(result: FullResult) {
    const reportPath = path.resolve('custom-report.html');
    
    const results = [...this.results.values()];

    // Fallback: Show results in terminal so you know it finished
    console.log('\n--- Test Execution Finished ---');
    console.table(results.map(r => ({ Area: r.area, Page: r.page, Type: r.kind, Status: r.status, Flaky: r.flaky ? 'yes' : '', Duration: `${r.duration}s` })));

    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status !== 'passed').length;
    const flakyCount = results.filter(r => r.flaky).length;

    const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const rows = results.map(res => `
      <tr class="${res.status}">
        <td><strong>${esc(res.page)}</strong><br><small class="muted">${esc(res.area)}</small></td>
        <td class="name-cell">
            <span class="kind ${res.kind}">${res.kind}</span>
            <div>${esc(res.scenario)}</div>
        </td>
        <td><code>${esc(res.specFile)}</code></td>
        <td>${res.url ? `<a href="${esc(res.url)}" target="_blank"><code>${esc(res.url)}</code></a>` : '<span class="muted">—</span>'}</td>
        <td>
            <span class="status-pill ${res.status}">${res.status.toUpperCase()}</span>
            ${res.flaky ? `<br><span class="status-pill flaky" title="passed after ${res.retry} ${res.retry === 1 ? 'retry' : 'retries'}">FLAKY · ${res.retry}×</span>` : ''}
        </td>
        <td class="num">${res.duration}s</td>
        <td class="ts">${esc(res.started)}</td>
        <td class="reason-cell">
            <div>${esc(res.reason)}</div>
            ${res.screenshot ? `
                <div class="screenshot-container">
                    <img src="data:image/png;base64,${res.screenshot}" onclick="window.open(this.src)" />
                </div>` : ''}
        </td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #f8fafc; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid #64748b; }
        .card.passed { border-top-color: #22c55e; }
        .card.failed { border-top-color: #ef4444; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 14px; }
        .status-pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-pill.passed { background: #dcfce7; color: #166534; }
        .status-pill.failed, .status-pill.timedOut, .status-pill.interrupted { background: #fee2e2; color: #991b1b; }
        .status-pill.skipped { background: #e2e8f0; color: #475569; }
        .status-pill.flaky { background: #fef3c7; color: #92400e; margin-top: 4px; }
        .card.flaky { border-top-color: #f59e0b; }
        .name-cell { font-size: 13px; color: #1e293b; max-width: 320px; }
        .muted { color: #94a3b8; font-size: 11px; }
        .kind { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 4px; }
        .kind.Positive { background: #dcfce7; color: #166534; }
        .kind.Negative { background: #fef3c7; color: #92400e; }
        .kind.Functional { background: #e0e7ff; color: #3730a3; }
        .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; color: #475569; }
        .ts { font-size: 12px; color: #64748b; white-space: nowrap; }
        td code { font-size: 12px; color: #334155; background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }
        .reason-cell { font-family: monospace; font-size: 12px; white-space: pre-wrap; max-width: 360px; }
        .screenshot-container img { max-width: 150px; border: 1px solid #ddd; margin-top: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h2>Test Execution Report</h2>
      <div class="summary">
        <div class="card"><strong>Total tests ran</strong><p>${total}</p></div>
        <div class="card passed"><strong>Passed</strong><p>${passed}</p></div>
        <div class="card failed"><strong>Failed</strong><p>${failed}</p></div>
        <div class="card flaky"><strong>Flaky</strong><p>${flakyCount}</p></div>
      </div>
      <table>
        <thead><tr>
          <th>Page / Area</th><th>Test (Type &amp; Scenario)</th><th>Spec File</th><th>Route</th>
          <th>Status</th><th>Duration</th><th>Started</th><th>Reason/Screenshot</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    // Emit a tiny machine-readable summary next to the HTML so downstream steps
    // (e.g. the email sender) can show clean counts without parsing the report.
    const summaryPath = path.resolve('report-summary.json');
    const summary = {
      total,
      passed,
      failed,
      flaky: flakyCount,
      status: failed > 0 ? 'failed' : 'passed',
      finishedAt: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(reportPath, html);
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`\n✨ Report saved: ${reportPath}`);

      if (!process.env.CI) {
        const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        // Use a slight delay to ensure the OS has finished writing the file
        setTimeout(() => exec(`${command} "${reportPath}"`), 500);
      }
    } catch (err) {
      console.error('Failed to write report:', err);
    }
    
  }
}

export default MyCustomReporter;
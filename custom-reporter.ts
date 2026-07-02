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
    'detail-crawl.spec.ts': 'Detail Page Crawl',
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

    // Derived metrics for the dashboard header.
    const passRate = total ? Math.round((passed / total) * 100) : 0;
    const totalSeconds = results.reduce((s, r) => s + (parseFloat(r.duration) || 0), 0);
    const durationLabel = totalSeconds >= 60
      ? `${Math.floor(totalSeconds / 60)}m ${Math.round(totalSeconds % 60)}s`
      : `${totalSeconds.toFixed(1)}s`;
    const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const overallOk = failed === 0;
    // The pass-rate ring fills proportionally (conic-gradient angle in degrees).
    const ringDeg = Math.round(passRate * 3.6);

    const rows = results.map(res => {
      // Normalise the raw Playwright status into a filter bucket.
      const bucket = res.status === 'passed' ? 'passed' : res.status === 'skipped' ? 'skipped' : 'failed';
      const hasReason = res.reason && res.reason !== 'Passed' && res.reason !== '—';
      return `
      <tr data-status="${bucket}" data-flaky="${res.flaky ? 'true' : 'false'}">
        <td class="subject" data-label="Page / Area">
          <div class="subject-page">${esc(res.page)}</div>
          <div class="subject-area">${esc(res.area)}</div>
        </td>
        <td class="name-cell" data-label="Test">
          <span class="kind ${res.kind}">${res.kind}</span>
          <div class="scenario">${esc(res.scenario)}</div>
        </td>
        <td data-label="Spec File"><code>${esc(res.specFile)}</code></td>
        <td data-label="Route">${res.url ? `<a href="${esc(res.url)}" target="_blank" rel="noreferrer" class="route">${esc(res.url)}</a>` : '<span class="muted">—</span>'}</td>
        <td class="status-col" data-label="Status">
          <span class="status-pill ${res.status}"><span class="dot"></span>${res.status.toUpperCase()}</span>
          ${res.flaky ? `<span class="status-pill flaky" title="passed after ${res.retry} ${res.retry === 1 ? 'retry' : 'retries'}">⚠ FLAKY · ${res.retry}×</span>` : ''}
        </td>
        <td class="num" data-label="Duration">${res.duration}s</td>
        <td class="ts" data-label="Started">${esc(res.started)}</td>
        <td class="reason-cell" data-label="Reason / Screenshot">
          ${hasReason ? `<div class="reason ${bucket}">${esc(res.reason)}</div>` : '<span class="muted">—</span>'}
          ${res.screenshot ? `
            <div class="screenshot-container">
              <img src="data:image/png;base64,${res.screenshot}" alt="screenshot" onclick="openLightbox(this.src)" />
            </div>` : ''}
        </td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>E2E Test Execution Report</title>
  <style>
    :root {
      --bg: #f1f5f9; --surface: #ffffff; --ink: #0f172a; --muted: #64748b; --faint: #94a3b8;
      --line: #e2e8f0; --line-soft: #f1f5f9; --brand: #4f46e5; --brand-ink: #3730a3;
      --green: #16a34a; --green-bg: #dcfce7; --green-ink: #166534;
      --red: #dc2626; --red-bg: #fee2e2; --red-ink: #991b1b;
      --amber: #d97706; --amber-bg: #fef3c7; --amber-ink: #92400e;
      --shadow: 0 1px 2px rgba(15,23,42,.04), 0 4px 12px rgba(15,23,42,.06);
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      margin: 0; background: var(--bg); color: var(--ink);
      -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.5;
    }
    .wrap { max-width: 1320px; margin: 0 auto; padding: 32px 28px 64px; }

    /* ---- Header ---- */
    header.report-head {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%);
      color: #fff; border-radius: 16px; padding: 28px 32px;
      display: flex; justify-content: space-between; align-items: center; gap: 24px;
      box-shadow: var(--shadow); flex-wrap: wrap;
    }
    .head-left h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.01em; }
    .head-left .sub { margin-top: 6px; color: #c7d2fe; font-size: 13px; display: flex; gap: 16px; flex-wrap: wrap; }
    .head-left .sub b { color: #e0e7ff; font-weight: 600; }
    .verdict {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px;
      font-weight: 700; font-size: 13px; letter-spacing: .02em; text-transform: uppercase;
    }
    .verdict.ok { background: rgba(34,197,94,.18); color: #bbf7d0; border: 1px solid rgba(34,197,94,.5); }
    .verdict.bad { background: rgba(239,68,68,.18); color: #fecaca; border: 1px solid rgba(239,68,68,.5); }

    /* ---- Summary cards ---- */
    .summary { display: grid; grid-template-columns: 1.4fr repeat(4, 1fr); gap: 16px; margin: 22px 0; }
    @media (max-width: 940px) { .summary { grid-template-columns: 1fr 1fr; } }
    .card {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
      padding: 18px 20px; box-shadow: var(--shadow); position: relative; overflow: hidden;
    }
    .card .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
    .card .value { font-size: 30px; font-weight: 750; margin-top: 6px; line-height: 1; }
    .card.metric::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .card.total::after  { background: var(--brand); }
    .card.passed::after { background: var(--green); }
    .card.failed::after { background: var(--red); }
    .card.flaky::after  { background: var(--amber); }
    .card.passed .value { color: var(--green-ink); }
    .card.failed .value { color: var(--red-ink); }
    .card.flaky .value  { color: var(--amber-ink); }

    /* pass-rate ring card */
    .card.rate { display: flex; align-items: center; gap: 18px; }
    .ring {
      width: 76px; height: 76px; border-radius: 50%; flex: none;
      background: conic-gradient(${overallOk ? 'var(--green)' : 'var(--brand)'} ${ringDeg}deg, var(--line) 0);
      display: grid; place-items: center;
    }
    .ring::before { content: ''; width: 56px; height: 56px; border-radius: 50%; background: var(--surface); grid-area: 1/1; }
    .ring span { grid-area: 1/1; font-size: 18px; font-weight: 750; color: var(--ink); }
    .rate .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
    .rate .rate-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }

    /* ---- Toolbar ---- */
    .toolbar { display: flex; align-items: center; gap: 12px; margin: 8px 0 14px; flex-wrap: wrap; }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-pill {
      border: 1px solid var(--line); background: var(--surface); color: var(--muted);
      padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all .12s ease; display: inline-flex; align-items: center; gap: 7px;
    }
    .filter-pill:hover { border-color: #cbd5e1; color: var(--ink); }
    .filter-pill .count { background: var(--line-soft); color: var(--muted); border-radius: 999px; padding: 1px 8px; font-size: 11px; }
    .filter-pill.active { background: var(--brand); border-color: var(--brand); color: #fff; }
    .filter-pill.active .count { background: rgba(255,255,255,.22); color: #fff; }
    .search { margin-left: auto; position: relative; }
    .search input {
      border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px 8px 34px; font-size: 13px;
      width: 240px; background: var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2394a3b8' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 12px center;
      color: var(--ink); outline: none; transition: border-color .12s;
    }
    .search input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(79,70,229,.12); }

    /* ---- Table ---- */
    .table-wrap { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      position: sticky; top: 0; z-index: 2; background: #f8fafc; text-align: left;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--muted);
      padding: 13px 16px; border-bottom: 1px solid var(--line); white-space: nowrap;
    }
    tbody td { padding: 14px 16px; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
    tbody tr { transition: background .1s; }
    tbody tr:hover { background: #fafbff; }
    tbody tr:last-child td { border-bottom: none; }

    .subject-page { font-weight: 650; color: var(--ink); }
    .subject-area { color: var(--faint); font-size: 12px; margin-top: 2px; }
    .name-cell { max-width: 320px; }
    .scenario { color: #334155; margin-top: 5px; font-size: 13px; }
    .muted { color: var(--faint); }
    code { font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace; font-size: 12px; color: #334155; background: var(--line-soft); padding: 2px 6px; border-radius: 5px; }
    a.route { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--brand-ink); text-decoration: none; word-break: break-all; }
    a.route:hover { text-decoration: underline; }

    .kind { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .kind.Positive { background: var(--green-bg); color: var(--green-ink); }
    .kind.Negative { background: var(--amber-bg); color: var(--amber-ink); }
    .kind.Functional { background: #e0e7ff; color: var(--brand-ink); }

    .status-col { white-space: nowrap; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 700; letter-spacing: .02em;
    }
    .status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-pill.passed { background: var(--green-bg); color: var(--green-ink); }
    .status-pill.failed, .status-pill.timedOut, .status-pill.interrupted { background: var(--red-bg); color: var(--red-ink); }
    .status-pill.skipped { background: #e2e8f0; color: #475569; }
    .status-pill.flaky { background: var(--amber-bg); color: var(--amber-ink); margin-top: 6px; }

    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--muted); }
    .ts { font-size: 12px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }

    .reason-cell { max-width: 360px; }
    .reason {
      font-family: ui-monospace, Menlo, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word;
      padding: 8px 10px; border-radius: 8px; border-left: 3px solid;
    }
    .reason.passed { background: var(--green-bg); color: var(--green-ink); border-color: var(--green); }
    .reason.failed { background: var(--red-bg); color: var(--red-ink); border-color: var(--red); }
    .reason.skipped { background: var(--line-soft); color: var(--muted); border-color: var(--faint); }
    .screenshot-container img { max-width: 160px; border: 1px solid var(--line); border-radius: 8px; margin-top: 10px; cursor: zoom-in; display: block; transition: transform .12s, box-shadow .12s; }
    .screenshot-container img:hover { transform: scale(1.02); box-shadow: var(--shadow); }

    .empty-row td { text-align: center; color: var(--faint); padding: 40px; font-style: italic; }

    footer { text-align: center; color: var(--faint); font-size: 12px; margin-top: 24px; }

    /* ---- Lightbox ---- */
    .lightbox { position: fixed; inset: 0; background: rgba(15,23,42,.82); display: none; place-items: center; z-index: 50; padding: 32px; cursor: zoom-out; }
    .lightbox.open { display: grid; }
    .lightbox img { max-width: 95vw; max-height: 92vh; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }

    /* ---- Responsive: tablet ---- */
    @media (max-width: 720px) {
      .wrap { padding: 18px 14px 48px; }
      header.report-head { padding: 22px 20px; border-radius: 14px; }
      .head-left h1 { font-size: 18px; }
      .head-left .sub { gap: 10px 16px; }
      .verdict { width: 100%; justify-content: center; }
      .summary { grid-template-columns: 1fr 1fr; gap: 12px; }
      .card.rate { grid-column: 1 / -1; }
      .card .value { font-size: 26px; }
      .toolbar { gap: 10px; }
      .search { margin-left: 0; flex: 1 1 100%; }
      .search input { width: 100%; }

      /* Collapse the 8-column table into one labeled card per test row. */
      .table-wrap { border: none; background: transparent; box-shadow: none; overflow: visible; }
      table, thead, tbody, tr, td { display: block; width: 100%; }
      thead { position: absolute; left: -9999px; }  /* visually hide header, keep a11y */
      tbody tr {
        background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
        box-shadow: var(--shadow); margin-bottom: 14px; padding: 6px 2px; overflow: hidden;
      }
      tbody tr:hover { background: var(--surface); }
      tbody tr:last-child td { border-bottom: none; }
      tbody td {
        display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left;
        padding: 11px 16px; border-bottom: 1px solid var(--line-soft);
      }
      tbody td::before {
        content: attr(data-label); font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .05em; color: var(--faint);
      }
      tbody td.subject::before { display: none; }  /* page name is its own heading */
      .subject-page { font-size: 16px; }
      .name-cell, .reason-cell { max-width: none; }
      .reason, .scenario { align-self: stretch; }  /* long text spans the card */
      .num { text-align: left; }
      a.route { word-break: break-all; }
      .empty-row td { display: block; }
      .empty-row td::before { display: none; }
    }

    /* ---- Responsive: small phone ---- */
    @media (max-width: 420px) {
      .summary { grid-template-columns: 1fr; }
      .card.rate { grid-column: auto; }
      .head-left .sub { flex-direction: column; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="report-head">
      <div class="head-left">
        <h1>E2E Test Execution Report</h1>
        <div class="sub">
          <span>Generated <b>${generatedAt}</b></span>
          <span>Total runtime <b>${durationLabel}</b></span>
          <span><b>${total}</b> tests</span>
        </div>
      </div>
      <div class="verdict ${overallOk ? 'ok' : 'bad'}">${overallOk ? '✓ All Passed' : `✕ ${failed} Failed`}</div>
    </header>

    <section class="summary">
      <div class="card rate">
        <div class="ring"><span>${passRate}%</span></div>
        <div>
          <div class="label">Pass Rate</div>
          <div class="rate-sub">${passed} of ${total} passed</div>
        </div>
      </div>
      <div class="card metric total"><div class="label">Total</div><div class="value">${total}</div></div>
      <div class="card metric passed"><div class="label">Passed</div><div class="value">${passed}</div></div>
      <div class="card metric failed"><div class="label">Failed</div><div class="value">${failed}</div></div>
      <div class="card metric flaky"><div class="label">Flaky</div><div class="value">${flakyCount}</div></div>
    </section>

    <div class="toolbar">
      <div class="filters">
        <button class="filter-pill active" data-filter="all">All <span class="count">${total}</span></button>
        <button class="filter-pill" data-filter="passed">Passed <span class="count">${passed}</span></button>
        <button class="filter-pill" data-filter="failed">Failed <span class="count">${failed}</span></button>
        <button class="filter-pill" data-filter="flaky">Flaky <span class="count">${flakyCount}</span></button>
      </div>
      <div class="search"><input id="search" type="text" placeholder="Search tests…" autocomplete="off"></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Page / Area</th><th>Test (Type &amp; Scenario)</th><th>Spec File</th><th>Route</th>
          <th>Status</th><th>Duration</th><th>Started</th><th>Reason / Screenshot</th>
        </tr></thead>
        <tbody>${rows}
          <tr class="empty-row" id="no-results" style="display:none"><td colspan="8">No tests match your filter.</td></tr>
        </tbody>
      </table>
    </div>

    <footer>Generated by the PMI custom Playwright reporter · ${generatedAt}</footer>
  </div>

  <div class="lightbox" id="lightbox" onclick="this.classList.remove('open')"><img alt="screenshot full"></div>

  <script>
    (function () {
      var pills = document.querySelectorAll('.filter-pill');
      var search = document.getElementById('search');
      var rows = Array.prototype.slice.call(document.querySelectorAll('tbody tr[data-status]'));
      var noResults = document.getElementById('no-results');
      var active = 'all';
      function apply() {
        var q = search.value.trim().toLowerCase();
        var shown = 0;
        rows.forEach(function (tr) {
          var okFilter = active === 'all'
            ? true
            : active === 'flaky' ? tr.dataset.flaky === 'true' : tr.dataset.status === active;
          var okSearch = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
          var show = okFilter && okSearch;
          tr.style.display = show ? '' : 'none';
          if (show) shown++;
        });
        noResults.style.display = shown ? 'none' : '';
      }
      pills.forEach(function (p) {
        p.addEventListener('click', function () {
          pills.forEach(function (x) { x.classList.remove('active'); });
          p.classList.add('active');
          active = p.dataset.filter;
          apply();
        });
      });
      search.addEventListener('input', apply);
    })();
    function openLightbox(src) {
      var lb = document.getElementById('lightbox');
      lb.querySelector('img').src = src;
      lb.classList.add('open');
    }
  </script>
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
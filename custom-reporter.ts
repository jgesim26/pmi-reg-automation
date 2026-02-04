import { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

class MyCustomReporter implements Reporter {
  private results: any[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const rawMessage = result.error?.message || '';
    const cleanReason = rawMessage.replace(/\u001b\[\d+m/g, '') || (result.status === 'passed' ? 'Success' : 'N/A');
    const testUrl = test.annotations.find(a => a.type === 'url')?.description || 'N/A';

    // Find screenshot
    const screenshotAttachment = result.attachments.find(a => a.name === 'screenshot');
    let screenshotBase64 = '';
    
    if (screenshotAttachment?.path && fs.existsSync(screenshotAttachment.path)) {
      screenshotBase64 = fs.readFileSync(screenshotAttachment.path).toString('base64');
    }

    this.results.push({
      page: test.title.split('-')[0].trim(),
      url: testUrl,
      status: result.status,
      reason: cleanReason,
      screenshot: screenshotBase64,
      duration: (result.duration / 1000).toFixed(2) // in seconds
    });
  }

  async onEnd(result: FullResult) {
    const reportPath = path.resolve('custom-report.html');
    
    // Fallback: Show results in terminal so you know it finished
    console.log('\n--- Test Execution Finished ---');
    console.table(this.results.map(r => ({ Page: r.page, Status: r.status })));

    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status !== 'passed').length;

    const rows = this.results.map(res => `
      <tr class="${res.status}">
        <td><strong>${res.page}</strong><br><small style="color:#94a3b8">${res.duration}s</small></td>
        <td><a href="${res.url}" target="_blank">${res.url}</a></td>
        <td><span class="status-pill ${res.status}">${res.status.toUpperCase()}</span></td>
        <td class="reason-cell">
            <div>${res.reason}</div>
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
        .status-pill { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-pill.passed { background: #dcfce7; color: #166534; }
        .status-pill.failed { background: #fee2e2; color: #991b1b; }
        .reason-cell { font-family: monospace; font-size: 12px; white-space: pre-wrap; }
        .screenshot-container img { max-width: 150px; border: 1px solid #ddd; margin-top: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h2>Test Report</h2>
      <div class="summary">
        <div class="card"><strong>Total</strong><p>${total}</p></div>
        <div class="card passed"><strong>Passed</strong><p>${passed}</p></div>
        <div class="card failed"><strong>Failed</strong><p>${failed}</p></div>
      </div>
      <table>
        <thead><tr><th>Page</th><th>URL</th><th>Status</th><th>Reason/Screenshot</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    try {
      fs.writeFileSync(reportPath, html);
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
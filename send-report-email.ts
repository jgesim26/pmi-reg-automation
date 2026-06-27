/**
 * Emails the generated E2E status report (custom-report.html) after a test run.
 *
 * Free + no third-party service: sends over SMTP (Gmail by default) using
 * nodemailer. Designed to run as a CI step after Playwright, but also works
 * locally. Configuration is via environment variables (see .env.example):
 *
 *   MAIL_USER  – SMTP username / sender address (e.g. you@gmail.com)   [required]
 *   MAIL_PASS  – SMTP password. For Gmail use an App Password, not the
 *                account password (requires 2FA enabled on the account). [required]
 *   MAIL_TO    – recipient(s), comma-separated                          [required]
 *   MAIL_HOST  – SMTP host           (default: smtp.gmail.com)
 *   MAIL_PORT  – SMTP port           (default: 465, implicit TLS)
 *   MAIL_FROM  – From header         (default: "PMI E2E Bot <MAIL_USER>")
 *
 * If the required vars are absent the script logs a notice and exits 0, so it
 * never breaks a pipeline that hasn't been configured with secrets yet.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

interface Summary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  status: 'passed' | 'failed';
  finishedAt: string;
}

const REPORT_PATH = path.resolve(__dirname, 'custom-report.html');
const SUMMARY_PATH = path.resolve(__dirname, 'report-summary.json');

function readSummary(): Summary {
  try {
    return JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8')) as Summary;
  } catch {
    return { total: 0, passed: 0, failed: 0, flaky: 0, status: 'passed', finishedAt: new Date().toISOString() };
  }
}

/** A link back to the originating CI run, when running on GitHub Actions. */
function ciRunLink(): string {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
  }
  // GitLab equivalent.
  if (process.env.CI_PIPELINE_URL) return process.env.CI_PIPELINE_URL;
  return '';
}

async function main() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const to = process.env.MAIL_TO;

  if (!user || !pass || !to) {
    console.log('ℹ️ Email skipped: MAIL_USER / MAIL_PASS / MAIL_TO not all set. (Configure secrets to enable.)');
    return;
  }

  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || 465);
  const from = process.env.MAIL_FROM || `PMI E2E Bot <${user}>`;

  const s = readSummary();
  const icon = s.status === 'passed' ? '✅' : '❌';
  const date = s.finishedAt.replace('T', ' ').slice(0, 16) + ' UTC';
  const subject = `PMI E2E ${icon} ${s.passed}/${s.total} passed${s.failed ? `, ${s.failed} failed` : ''}${s.flaky ? `, ${s.flaky} flaky` : ''} — ${date}`;
  const runLink = ciRunLink();

  const body = `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#1e293b">
      <h2 style="margin:0 0 4px">PMI E2E Status Report ${icon}</h2>
      <p style="color:#64748b;margin:0 0 16px">Run finished ${date}</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 16px 4px 0"><strong>Total tests</strong></td><td>${s.total}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#166534"><strong>Passed</strong></td><td>${s.passed}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#991b1b"><strong>Failed</strong></td><td>${s.failed}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#92400e"><strong>Flaky</strong></td><td>${s.flaky}</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#475569">The full HTML report (with screenshots) is attached.</p>
      ${runLink ? `<p style="margin:8px 0 0"><a href="${runLink}">View the CI run →</a></p>` : ''}
    </div>`;

  const attachments = fs.existsSync(REPORT_PATH)
    ? [{ filename: 'custom-report.html', path: REPORT_PATH, contentType: 'text/html' }]
    : [];
  if (!attachments.length) console.log('⚠️ custom-report.html not found — sending summary without attachment.');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // implicit TLS on 465; STARTTLS on 587
    auth: { user, pass },
  });

  await transporter.verify();
  const info = await transporter.sendMail({ from, to, subject, html: body, attachments });
  console.log(`✅ Status report emailed to ${to} (messageId: ${info.messageId})`);
}

main().catch((err) => {
  console.error('❌ Failed to send status report email:', err?.message || err);
  process.exit(1);
});

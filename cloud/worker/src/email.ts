const UNOSEND_API_KEY = process.env.UNOSEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'alerts@etalon.nma.vc';
const FROM_NAME = process.env.FROM_NAME || 'ETALON';
const APP_URL = process.env.APP_URL || 'https://etalon.nma.vc';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!UNOSEND_API_KEY) {
    console.warn('[email] UNOSEND_API_KEY not set, skipping email');
    return false;
  }

  try {
    const res = await fetch('https://api.unosend.co/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNOSEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Failed (${res.status}):`, body);
      return false;
    }

    console.log(`[email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (err: unknown) {
    console.error('[email] Error:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

// Alert email templates
export function newTrackerEmail(siteName: string, trackers: string[], scanUrl: string): EmailOptions {
  return {
    to: '', // Filled by caller
    subject: `⚠️ ${trackers.length} tracker(s) detected on ${siteName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e5e5e5; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #059669, #06b6d4); border-radius: 10px; line-height: 36px; font-size: 18px;">◉</span>
      <span style="font-size: 20px; font-weight: 700; margin-left: 8px; vertical-align: middle;">ETALON</span>
    </div>
    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #f5f5f5;">New trackers detected</h2>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px;">On <strong>${siteName}</strong></p>
      <div style="background: #0f0f13; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        ${trackers.map(t => `<div style="padding: 6px 0; border-bottom: 1px solid #27272a; font-size: 14px;">🔴 ${t}</div>`).join('')}
      </div>
      <a href="${scanUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #06b6d4); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View scan results →</a>
    </div>
    <p style="text-align: center; color: #52525b; font-size: 12px; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/settings" style="color: #52525b;">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>`,
  };
}

export function scoreDropEmail(siteName: string, oldScore: number, newScore: number, grade: string, scanUrl: string): EmailOptions {
  return {
    to: '',
    subject: `📉 Score dropped on ${siteName} (${oldScore} → ${newScore})`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e5e5e5; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #059669, #06b6d4); border-radius: 10px; line-height: 36px; font-size: 18px;">◉</span>
      <span style="font-size: 20px; font-weight: 700; margin-left: 8px; vertical-align: middle;">ETALON</span>
    </div>
    <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; text-align: center;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #f5f5f5;">Compliance score dropped</h2>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px;">${siteName}</p>
      <div style="font-size: 48px; font-weight: 700; margin: 16px 0;">
        <span style="color: #ef4444;">${newScore}</span>
        <span style="color: #52525b; font-size: 24px;">/100</span>
      </div>
      <p style="color: #a1a1aa; font-size: 14px;">Grade: <strong style="color: #ef4444;">${grade}</strong> · Was: ${oldScore}/100</p>
      <a href="${scanUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #06b6d4); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 24px;">View details →</a>
    </div>
    <p style="text-align: center; color: #52525b; font-size: 12px; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/settings" style="color: #52525b;">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>`,
  };
}

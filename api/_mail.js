// High End Fire — shared transactional email sender (Brevo)
//
// Moved off Resend 2026-08-18. Resend's free plan allows a single verified
// domain and essetech.com.au already occupies it, so every High End Fire
// email was going out as onboarding@resend.dev. Brevo is free, and
// highendfire.com.au is authenticated there (SPF + DKIM + DMARC), so mail
// now sends from a real High End Fire address.

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

// Accepts either "Name <addr@example.com>" or a bare "addr@example.com"
// so the existing CONTACT_FROM_EMAIL / ORDER_FROM_EMAIL values keep working.
export function parseAddress(value) {
  const raw = String(value || '').trim();
  const angle = raw.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/);
  if (angle) {
    const name = angle[1].replace(/^["']|["']$/g, '').trim();
    return name ? { name, email: angle[2] } : { email: angle[2] };
  }
  return { email: raw };
}

export async function sendEmail({ to, from, subject, html, text, replyTo, apiKey }) {
  const key = (apiKey || process.env.BREVO_API_KEY || '').trim();
  if (!key) throw new Error('BREVO_API_KEY not configured');

  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((addr) => parseAddress(addr));

  const payload = {
    sender: parseAddress(from),
    to: recipients,
    subject,
  };
  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;
  // Brevo requires at least one body; a bare subject would 400.
  if (!html && !text) payload.textContent = subject;
  if (replyTo) payload.replyTo = parseAddress(replyTo);

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
  return res.json().catch(() => ({}));
}

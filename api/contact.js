// High End Fire — Contact form handler
// POST /api/contact → sends email via Brevo

import { sendEmail } from './_mail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'jonathon@highendfire.com.au';
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'High End Fire <jonathon@highendfire.com.au>';

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { name, email, subject, message, _honey } = body || {};

  // Honeypot — silently accept bot submissions
  if (_honey) return res.status(200).json({ success: true });

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const safe = (s) => String(s).replace(/[<>]/g, (c) => ({ '<': '&lt;', '>': '&gt;' }[c]));

  const subjectLine = subject
    ? `New Enquiry — High End Fire (${safe(subject)})`
    : 'New Enquiry — High End Fire';

  const html = `
    <h2>New enquiry from highendfire.com.au</h2>
    <p><strong>Name:</strong> ${safe(name)}</p>
    <p><strong>Email:</strong> ${safe(email)}</p>
    <p><strong>Subject:</strong> ${safe(subject || '—')}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${safe(message)}</p>
  `;

  try {
    try {
      await sendEmail({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        replyTo: email,
        subject: subjectLine,
        html,
        apiKey: BREVO_API_KEY
      });
    } catch (sendErr) {
      console.error('Brevo send error:', sendErr);
      return res.status(502).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

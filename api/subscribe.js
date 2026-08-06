// High End Fire — Watchlist / free-pack signup handler
// POST /api/subscribe → adds the contact to a Brevo list
//
// Replaces the FormSubmit.co endpoints the signup forms used to post to.
// FormSubmit only ever emailed Jonathon a copy, which meant every subscriber
// was stranded in Gmail and no newsletter could actually be sent to them.
//
// Required env vars (Vercel → Settings → Environment Variables):
//   BREVO_API_KEY        v3 API key from Brevo → SMTP & API → API Keys
//   BREVO_LIST_ID        numeric id of the Watchlist list
// Optional:
//   BREVO_LIST_ID_SHOW   separate list for card-show signups (source starts
//                        with "show"). Falls back to BREVO_LIST_ID if unset.
//   RESEND_API_KEY       already set for api/contact.js — used as the fallback
//                        below so a signup is never silently lost.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { email, source, _honey } = body || {};

  // Honeypot — accept silently so bots don't learn anything, but don't store.
  if (_honey) return res.status(200).json({ success: true });

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanSource = String(source || 'site').slice(0, 60);

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const listId = /^show/i.test(cleanSource)
    ? process.env.BREVO_LIST_ID_SHOW || process.env.BREVO_LIST_ID
    : process.env.BREVO_LIST_ID;

  let subscribed = false;

  if (BREVO_API_KEY && listId) {
    try {
      const r = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          email: cleanEmail,
          listIds: [Number(listId)],
          // Existing contacts are updated and added to the list rather than
          // returning a duplicate_parameter error, so a repeat signup is a no-op.
          updateEnabled: true
        })
      });

      if (r.ok) {
        subscribed = true;
      } else {
        const detail = await r.text();
        console.error('Brevo error:', r.status, detail);
      }
    } catch (err) {
      console.error('Brevo request failed:', err);
    }
  } else {
    console.error('Brevo not configured — missing BREVO_API_KEY or BREVO_LIST_ID');
  }

  // Fallback. Losing an email captured at a card show is far worse than a
  // duplicate notification, so if Brevo is unreachable or unconfigured we mail
  // the address to ourselves and still tell the visitor they're on the list.
  if (!subscribed) {
    const notified = await notifyByEmail(cleanEmail, cleanSource);
    if (!notified) {
      return res.status(502).json({ error: 'Signup failed — please try again' });
    }
    return res.status(200).json({ success: true, queued: true });
  }

  return res.status(200).json({ success: true });
}

async function notifyByEmail(email, source) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return false;

  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'jonathon@highendfire.shop';
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'High End Fire <onboarding@resend.dev>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `⚠️ Signup NOT saved to Brevo — ${email}`,
        html: `<h2>Add this contact to Brevo manually</h2>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Source:</strong> ${source}</p>
               <p>Brevo rejected or was not configured for this signup. Check
                  BREVO_API_KEY / BREVO_LIST_ID in the Vercel environment
                  variables, then add this address by hand.</p>`
      })
    });
    return r.ok;
  } catch (err) {
    console.error('Fallback notification failed:', err);
    return false;
  }
}

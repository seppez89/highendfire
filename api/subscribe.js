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

// `source` comes off a hidden form field, so anything can be posted to it.
// These notifications are read in a mail client, so escape before interpolating.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export default async function handler(req, res) {
  // GET is a readiness check, so the setup can be confirmed from a phone before
  // the doors open rather than by submitting a test signup. Booleans only —
  // it never echoes a key or a list id back.
  if (req.method === 'GET') {
    // Trimmed because a key pasted into a dashboard very often arrives with a
    // trailing space or newline, which Brevo rejects as a bad key.
    const key = (process.env.BREVO_API_KEY || '').trim();
    const listId = (process.env.BREVO_LIST_ID || '').trim();

    if (!key || !listId) {
      return res.status(200).json({
        ready: false,
        message: 'NOT READY — set BREVO_API_KEY and BREVO_LIST_ID in Vercel, then redeploy.',
        missing: [!key && 'BREVO_API_KEY', !listId && 'BREVO_LIST_ID'].filter(Boolean),
        fallbackEmail: Boolean(process.env.RESEND_API_KEY)
      });
    }

    // Having the variables set is not the same as them working. Ask Brevo
    // directly so a wrong key or a mistyped list id is visible here rather than
    // showing up as silently-queued signups on the day of a show.
    const checks = {};
    for (const [label, id] of [
      ['watchlist', listId],
      ['showList', process.env.BREVO_LIST_ID_SHOW]
    ]) {
      if (!id) { checks[label] = 'not set (falls back to the watchlist)'; continue; }
      try {
        const r = await fetch(`https://api.brevo.com/v3/contacts/lists/${Number(id)}`, {
          headers: { 'api-key': key, Accept: 'application/json' }
        });
        if (r.ok) {
          // Deliberately not the list name or subscriber count. Anyone can load
          // this URL, and how many subscribers the shop has is nobody's business.
          checks[label] = `OK — list ${id} reachable`;
        } else if (r.status === 401) {
          // Brevo's SMTP keys and API keys live on the same page and look
          // alike, but only the API key (xkeysib-) works with the v3 REST API.
          // Brevo's own wording separates two failures that look identical from
          // the outside, so it decides the branch — but it is logged rather
          // than returned, because this URL is public. The categories below are
          // enough to act on; the log has the detail if one is ever wrong.
          const reason = await r.text().then(
            t => { try { return JSON.parse(t).message || t; } catch { return t; } },
            () => 'no detail'
          );
          console.error('Brevo 401:', reason);

          if (/unrecognised IP|unrecognized IP|authorised_ips/i.test(reason)) {
            // Not a key problem at all, and the trap for any serverless host:
            // Brevo's "authorised IPs" setting pins the key to fixed addresses,
            // and Vercel's change from request to request. The fix is Brevo →
            // Security → Authorized IPs → deactivate blocking for API keys;
            // whitelisting single addresses does not hold.
            checks[label] = 'IP BLOCKED — the key is fine. Brevo → Security → Authorized IPs → turn OFF blocking for API keys.';
          } else if (key.startsWith('xsmtpsib-')) {
            checks[label] = 'WRONG KEY TYPE — that is an SMTP key. Use the API Keys tab, not SMTP Keys.';
          } else if (!key.startsWith('xkeysib-')) {
            checks[label] = 'BAD KEY — this does not look like a Brevo API key (they start xkeysib-).';
          } else if (key.length < 80) {
            checks[label] = 'BAD KEY — copied incomplete. Paste the whole key again.';
          } else {
            checks[label] = 'BAD KEY — right type and full length, so it has probably been revoked.';
          }
        } else if (r.status === 404) {
          checks[label] = `NO SUCH LIST — Brevo has no list with id ${id} (404). Check the number.`;
        } else {
          checks[label] = `FAILED — Brevo returned ${r.status}.`;
        }
      } catch {
        checks[label] = 'FAILED — could not reach Brevo.';
      }
    }

    const ready = String(checks.watchlist).startsWith('OK');
    return res.status(200).json({
      ready,
      message: ready
        ? 'Ready — signups are being saved to the Brevo list.'
        : 'NOT READY — see the checks below. Signups are only being logged.',
      checks,
      fallbackEmail: Boolean(process.env.RESEND_API_KEY)
    });
  }

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

  const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
  const rawListId = /^show/i.test(cleanSource)
    ? process.env.BREVO_LIST_ID_SHOW || process.env.BREVO_LIST_ID
    : process.env.BREVO_LIST_ID;
  const listId = (rawListId || '').trim();

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

  // Every signup is emailed through, not just the failures. At the table it is
  // the only way to confirm on the spot that someone actually typed their
  // address in before the pack is handed over — which is what FormSubmit used
  // to do, and the reason the flow felt trustworthy.
  const notified = await notifyByEmail(cleanEmail, cleanSource, subscribed);

  if (!subscribed) {
    // Last resort. A customer standing at the table who gets an error is gone
    // for good, so the address goes to the function log where it can still be
    // recovered (Vercel → the project → Logs, search CAPTURED_SIGNUP) and the
    // visitor is told they're on the list. Recovering an address from a log is
    // unpleasant; losing it is worse. This is a net, not a plan — Brevo still
    // needs configuring, which is what the GET readiness check above is for.
    console.error(`CAPTURED_SIGNUP\t${cleanEmail}\t${cleanSource}\tmailed=${notified}`);

    return res.status(200).json({ success: true, queued: true });
  }

  return res.status(200).json({ success: true });
}

async function notifyByEmail(email, source, saved) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return false;

  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'jonathon@highendfire.com.au';
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'High End Fire <onboarding@resend.dev>';

  // The subject carries the whole message, because at a show this gets read on
  // a lock screen with a customer waiting. Address first, so it is visible
  // before the notification truncates.
  const subject = saved
    ? `New signup: ${email} (${source})`
    : `⚠️ Signup NOT saved to Brevo — ${email}`;

  const body = saved
    ? `<h2>New signup</h2>
       <p><strong>Email:</strong> ${escapeHtml(email)}</p>
       <p><strong>Where from:</strong> ${escapeHtml(source)}</p>
       <p>Already added to the Brevo list — nothing to do. This is just so you
          can confirm at the table that it went through.</p>`
    : `<h2>Add this contact to Brevo manually</h2>
       <p><strong>Email:</strong> ${escapeHtml(email)}</p>
       <p><strong>Where from:</strong> ${escapeHtml(source)}</p>
       <p>Brevo rejected or was not configured for this signup. Check
          BREVO_API_KEY / BREVO_LIST_ID in the Vercel environment
          variables, then add this address by hand.</p>`;

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
        reply_to: email,
        subject,
        html: body
      })
    });
    return r.ok;
  } catch (err) {
    console.error('Fallback notification failed:', err);
    return false;
  }
}

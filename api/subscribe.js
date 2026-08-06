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
          const list = await r.json();
          checks[label] = `OK — id ${id} is "${list.name}" (${list.totalSubscribers} subscribers)`;
        } else if (r.status === 401) {
          // Brevo's SMTP keys and API keys live on the same page and look
          // alike, but only the API key (xkeysib-) works with the v3 REST API.
          // Report the shape and Brevo's own wording, never the value itself —
          // "Key not found" and "unrecognised IP address" are different jobs.
          const reason = await r.text().then(
            t => { try { return JSON.parse(t).message || t; } catch { return t; } },
            () => 'no detail'
          );
          const said = String(reason).slice(0, 220);

          if (/unrecognised IP|unrecognized IP|authorised_ips/i.test(reason)) {
            // This one is not a key problem at all, and it is the trap for any
            // serverless host: Brevo's "authorised IPs" setting pins the key to
            // fixed addresses, and Vercel's change from request to request.
            checks[label] = `IP BLOCKED — the key is fine. Brevo's "authorised IPs" security setting is refusing this server. Turn it off at https://app.brevo.com/security/authorised_ips — whitelisting one address is not a fix, because Vercel's changes constantly. Brevo says: "${said}"`;
          } else if (key.startsWith('xsmtpsib-')) {
            checks[label] = 'WRONG KEY TYPE — that is an SMTP key. Use the API Keys tab, not SMTP Keys.';
          } else if (!key.startsWith('xkeysib-')) {
            checks[label] = 'BAD KEY — this does not look like a Brevo API key (they start xkeysib-). Check what got pasted.';
          } else if (key.length < 80) {
            checks[label] = `BAD KEY — only ${key.length} characters; a full Brevo API key is about 89, so it was copied incomplete. Paste it again.`;
          } else {
            checks[label] = `BAD KEY — right type and full length, so it has probably been revoked. Brevo says: "${said}"`;
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

  // Fallback. Losing an email captured at a card show is far worse than a
  // duplicate notification, so if Brevo is unreachable or unconfigured we mail
  // the address to ourselves and still tell the visitor they're on the list.
  if (!subscribed) {
    const notified = await notifyByEmail(cleanEmail, cleanSource);

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

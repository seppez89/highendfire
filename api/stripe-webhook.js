// High End Fire — Stripe Webhook Handler
// POST /api/stripe-webhook
//
// Listens for `checkout.session.completed`. On success:
//   1. Sends a "you got an order" alert to the seller (jonathon@highendfire.shop)
//      with full shipping address + buyer email.
//   2. Sends a branded order confirmation to the buyer.
//
// Both emails go through Resend.
//
// Env vars required:
//   STRIPE_SECRET_KEY      — same key checkout.js uses (for retrieving line items)
//   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard → Developers → Webhooks → endpoint signing secret
//   RESEND_API_KEY         — same key contact.js uses
//   ORDER_ALERT_TO         — optional, defaults to jonathon@highendfire.shop
//   ORDER_FROM_EMAIL       — optional, defaults to "High End Fire <onboarding@resend.dev>"
//                            (set to noreply@highendfire.shop after verifying the domain in Resend)

import crypto from 'node:crypto';

// Disable Vercel's automatic body parsing — we need the raw body for signature verification.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Stripe-signature header format: "t=<unix_ts>,v1=<hash>,v1=<hash2>,..."
// HMAC-SHA256 of `${ts}.${rawBody}` with webhook secret. v0 is older scheme — ignore.
function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSeconds = 300) {
  if (!sigHeader || typeof sigHeader !== 'string') return false;
  const parts = Object.create(null);
  sigHeader.split(',').forEach((kv) => {
    const idx = kv.indexOf('=');
    if (idx < 0) return;
    const k = kv.slice(0, idx).trim();
    const v = kv.slice(idx + 1).trim();
    if (k === 't') parts.t = v;
    else if (k === 'v1') (parts.v1 ||= []).push(v);
  });
  if (!parts.t || !parts.v1?.length) return false;

  const ts = parseInt(parts.t, 10);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody.toString('utf8')}`)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  return parts.v1.some((sig) => {
    const sigBuf = Buffer.from(sig, 'hex');
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}

async function fetchSessionWithLineItems(sessionId, stripeKey) {
  const params = new URLSearchParams();
  params.append('expand[]', 'line_items');
  params.append('expand[]', 'line_items.data.price.product');
  params.append('expand[]', 'shipping_cost.shipping_rate');
  params.append('expand[]', 'customer_details');
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${stripeKey}` } }
  );
  return res.json();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function fmtMoney(cents, currency) {
  return `$${((cents || 0) / 100).toFixed(2)} ${(currency || 'aud').toUpperCase()}`;
}

function formatAddress(addr) {
  if (!addr) return '—';
  return [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(' '), addr.country]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br>');
}

function buildSellerEmail(session) {
  const orderNumber = ('HEF-' + session.id.slice(-8)).toUpperCase();
  const items = session.line_items?.data || [];
  const buyerName = session.customer_details?.name || session.shipping_details?.name || '—';
  const buyerEmail = session.customer_details?.email || '—';
  const phone = session.customer_details?.phone || '';
  const ship = session.shipping_details?.address;
  const shippingMethod = session.shipping_cost?.shipping_rate?.display_name || 'Standard';
  const shippingCost = fmtMoney(session.shipping_cost?.amount_total, session.currency);
  const subtotal = fmtMoney(session.amount_subtotal, session.currency);
  const total = fmtMoney(session.amount_total, session.currency);

  const itemsHtml = items
    .map(
      (li) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;">
          <strong>${escapeHtml(li.price?.product?.name || li.description)}</strong>
          ${li.price?.product?.description ? `<br><span style="font-size:12px;color:#666;">${escapeHtml(li.price.product.description)}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">${li.quantity || 1}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(li.amount_total, session.currency)}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `🛒 New Order ${orderNumber} — ${total}`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
  <h1 style="color:#e05c2a;font-size:24px;margin:0 0 8px;">New Order — ${orderNumber}</h1>
  <p style="color:#666;font-size:14px;margin:0 0 24px;">Paid via Stripe · ${total}</p>

  <h2 style="font-size:16px;margin:0 0 8px;">Items</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f7f7f7;">
        <th style="padding:8px;text-align:left;">Item</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px;text-align:right;color:#666;">Subtotal</td><td style="padding:8px;text-align:right;">${subtotal}</td></tr>
      <tr><td colspan="2" style="padding:8px;text-align:right;color:#666;">Shipping (${escapeHtml(shippingMethod)})</td><td style="padding:8px;text-align:right;">${shippingCost}</td></tr>
      <tr><td colspan="2" style="padding:8px;text-align:right;font-weight:700;">TOTAL</td><td style="padding:8px;text-align:right;font-weight:700;color:#e05c2a;">${total}</td></tr>
    </tfoot>
  </table>

  <h2 style="font-size:16px;margin:24px 0 8px;">Ship To</h2>
  <div style="background:#f7f7f7;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;">
    <strong>${escapeHtml(buyerName)}</strong><br>
    ${formatAddress(ship)}
    ${phone ? `<br>📞 ${escapeHtml(phone)}` : ''}
  </div>

  <h2 style="font-size:16px;margin:24px 0 8px;">Buyer Contact</h2>
  <p style="font-size:14px;margin:0;">
    <a href="mailto:${escapeHtml(buyerEmail)}" style="color:#e05c2a;">${escapeHtml(buyerEmail)}</a>
  </p>

  <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;">
    Stripe session: <code>${escapeHtml(session.id)}</code><br>
    View in Stripe: <a href="https://dashboard.stripe.com/payments/${escapeHtml(session.payment_intent || '')}" style="color:#666;">dashboard.stripe.com</a>
  </p>
</div>`,
    text: `New Order ${orderNumber} — ${total}\n\nBuyer: ${buyerName} <${buyerEmail}>\nShip to: ${[ship?.line1, ship?.city, ship?.country].filter(Boolean).join(', ')}\n\nView in Stripe: https://dashboard.stripe.com/payments/${session.payment_intent || ''}`,
  };
}

function buildBuyerEmail(session) {
  const orderNumber = ('HEF-' + session.id.slice(-8)).toUpperCase();
  const items = session.line_items?.data || [];
  const buyerName = session.customer_details?.name || 'there';
  const shippingMethod = session.shipping_cost?.shipping_rate?.display_name || 'Standard';
  const shippingCost = fmtMoney(session.shipping_cost?.amount_total, session.currency);
  const subtotal = fmtMoney(session.amount_subtotal, session.currency);
  const total = fmtMoney(session.amount_total, session.currency);

  const itemsHtml = items
    .map(
      (li) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;">
          <strong>${escapeHtml(li.price?.product?.name || li.description)}</strong>
          ${li.price?.product?.description ? `<br><span style="font-size:12px;color:#666;">${escapeHtml(li.price.product.description)}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">${li.quantity || 1}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(li.amount_total, session.currency)}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `🔥 Order Confirmed — ${orderNumber}`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
  <h1 style="color:#e05c2a;font-size:28px;margin:0 0 8px;">Thanks ${escapeHtml(buyerName.split(' ')[0])}! Your order is confirmed.</h1>
  <p style="color:#666;font-size:14px;margin:0 0 24px;">Order <strong>${orderNumber}</strong></p>

  <p style="font-size:15px;line-height:1.6;">
    We've got your order and we'll have it carefully sleeved, top-loaded, team-bagged, and shipped within 1–2 business days.
    You'll get tracking details as soon as it leaves the door.
  </p>

  <h2 style="font-size:16px;margin:24px 0 8px;">Your Order</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f7f7f7;">
        <th style="padding:8px;text-align:left;">Item</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px;text-align:right;color:#666;">Subtotal</td><td style="padding:8px;text-align:right;">${subtotal}</td></tr>
      <tr><td colspan="2" style="padding:8px;text-align:right;color:#666;">Shipping (${escapeHtml(shippingMethod)})</td><td style="padding:8px;text-align:right;">${shippingCost}</td></tr>
      <tr><td colspan="2" style="padding:8px;text-align:right;font-weight:700;">TOTAL</td><td style="padding:8px;text-align:right;font-weight:700;color:#e05c2a;">${total}</td></tr>
    </tfoot>
  </table>

  <p style="font-size:14px;margin:24px 0;">
    Questions? Just reply to this email or write to <a href="mailto:jonathon@highendfire.shop" style="color:#e05c2a;">jonathon@highendfire.shop</a>.
  </p>

  <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;">
    🔥 High End Fire Collectables · <a href="https://highendfire.shop" style="color:#999;">highendfire.shop</a><br>
    <a href="https://instagram.com/highendfire_" style="color:#999;">Instagram</a> · <a href="https://tiktok.com/@highendfire" style="color:#999;">TikTok</a>
  </p>
</div>`,
    text: `Thanks ${buyerName}! Your order is confirmed.\n\nOrder ${orderNumber}\nTotal: ${total}\n\nWe'll ship within 1-2 business days and send tracking details as soon as it leaves the door.\n\nQuestions? Reply to this email or write to jonathon@highendfire.shop.\n\n— High End Fire Collectables\nhttps://highendfire.shop`,
  };
}

async function sendResendEmail({ to, from, subject, html, text, replyTo, apiKey }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const ORDER_ALERT_TO = process.env.ORDER_ALERT_TO || 'jonathon@highendfire.shop';
  const ORDER_FROM_EMAIL = process.env.ORDER_FROM_EMAIL || 'High End Fire <onboarding@resend.dev>';

  if (!STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBody = await readRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Acknowledge events we don't care about so Stripe stops retrying.
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  const sessionStub = event.data?.object;
  if (!sessionStub?.id) {
    return res.status(400).json({ error: 'No session in event' });
  }

  // Re-fetch with line items expanded — the webhook payload doesn't include them.
  const session = await fetchSessionWithLineItems(sessionStub.id, STRIPE_SECRET_KEY);
  if (session.error) {
    return res.status(500).json({ error: 'Failed to fetch session: ' + session.error.message });
  }

  if (!RESEND_API_KEY) {
    // Webhook still succeeds (Stripe doesn't retry), but we log so it's visible in Vercel logs.
    console.error('RESEND_API_KEY missing — order received but no email sent. Session:', session.id);
    return res.status(200).json({ received: true, warning: 'email service not configured' });
  }

  const buyerEmail = session.customer_details?.email;
  const seller = buildSellerEmail(session);
  const buyer = buildBuyerEmail(session);

  const sendTasks = [
    sendResendEmail({
      to: ORDER_ALERT_TO,
      from: ORDER_FROM_EMAIL,
      subject: seller.subject,
      html: seller.html,
      text: seller.text,
      replyTo: buyerEmail || undefined,
      apiKey: RESEND_API_KEY,
    }).catch((e) => ({ error: 'seller: ' + e.message })),
  ];

  if (buyerEmail) {
    sendTasks.push(
      sendResendEmail({
        to: buyerEmail,
        from: ORDER_FROM_EMAIL,
        subject: buyer.subject,
        html: buyer.html,
        text: buyer.text,
        replyTo: 'jonathon@highendfire.shop',
        apiKey: RESEND_API_KEY,
      }).catch((e) => ({ error: 'buyer: ' + e.message }))
    );
  }

  const results = await Promise.all(sendTasks);
  const errors = results.filter((r) => r && r.error).map((r) => r.error);
  if (errors.length) console.error('Webhook email errors:', errors, 'session:', session.id);

  return res.status(200).json({ received: true, emails_sent: results.length - errors.length, errors });
}

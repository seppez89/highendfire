// High End Fire — Vercel Serverless Function
// GET /api/order?session_id=cs_xxx → returns sanitised order summary for success.html
//
// Privacy: only returns what the buyer themselves should see (items, totals, masked
// shipping city/country). Does NOT return full address, email, or payment details.
// Session IDs are unguessable, so possessing one is treated as proof of ownership.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sessionId = req.query.session_id;
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Missing or invalid session_id' });
  }

  const params = new URLSearchParams();
  params.append('expand[]', 'line_items');
  params.append('expand[]', 'line_items.data.price.product');
  params.append('expand[]', 'shipping_cost.shipping_rate');

  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${params.toString()}`;
  const stripeRes = await fetch(url, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const session = await stripeRes.json();

  if (session.error) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment not completed' });
  }

  const currency = (session.currency || 'aud').toUpperCase();
  const items = (session.line_items?.data || []).map((li) => ({
    name: li.price?.product?.name || li.description || 'Item',
    description: li.price?.product?.description || '',
    images: li.price?.product?.images || [],
    quantity: li.quantity || 1,
    unit_amount: (li.price?.unit_amount || 0) / 100,
    amount_total: (li.amount_total || 0) / 100,
  }));

  const shippingMethod = session.shipping_cost?.shipping_rate?.display_name || 'Standard';
  const shippingCity = session.shipping_details?.address?.city || '';
  const shippingCountry = session.shipping_details?.address?.country || '';

  return res.status(200).json({
    order_number: ('HEF-' + sessionId.slice(-8)).toUpperCase(),
    created: session.created,
    currency,
    items,
    subtotal: (session.amount_subtotal || 0) / 100,
    shipping_total: (session.shipping_cost?.amount_total || 0) / 100,
    shipping_method: shippingMethod,
    shipping_to: [shippingCity, shippingCountry].filter(Boolean).join(', '),
    total: (session.amount_total || 0) / 100,
  });
}

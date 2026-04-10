// High End Fire — Vercel Serverless Function
// Handles POST /api/checkout → creates Stripe Checkout session

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let items, origin;
  try {
    ({ items, origin } = req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in cart' });
  }

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/#pokemon`);

  const countries = ['AU', 'US', 'GB', 'NZ', 'JP', 'CA', 'DE', 'FR', 'SG'];
  countries.forEach((c) =>
    params.append('shipping_address_collection[allowed_countries][]', c)
  );

  // Australia — $10 flat rate
  params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '1000');
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'aud');
  params.append('shipping_options[0][shipping_rate_data][display_name]', 'Australia Tracked Shipping');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '3');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
  params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '7');
  params.append('shipping_options[0][shipping_rate_data][metadata][countries]', 'AU');

  // International Standard — $50 AUD
  params.append('shipping_options[1][shipping_rate_data][type]', 'fixed_amount');
  params.append('shipping_options[1][shipping_rate_data][fixed_amount][amount]', '5000');
  params.append('shipping_options[1][shipping_rate_data][fixed_amount][currency]', 'aud');
  params.append('shipping_options[1][shipping_rate_data][display_name]', 'International Standard');
  params.append('shipping_options[1][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
  params.append('shipping_options[1][shipping_rate_data][delivery_estimate][minimum][value]', '10');
  params.append('shipping_options[1][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
  params.append('shipping_options[1][shipping_rate_data][delivery_estimate][maximum][value]', '20');

  // International Express — $80 AUD
  params.append('shipping_options[2][shipping_rate_data][type]', 'fixed_amount');
  params.append('shipping_options[2][shipping_rate_data][fixed_amount][amount]', '8000');
  params.append('shipping_options[2][shipping_rate_data][fixed_amount][currency]', 'aud');
  params.append('shipping_options[2][shipping_rate_data][display_name]', 'International Express');
  params.append('shipping_options[2][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
  params.append('shipping_options[2][shipping_rate_data][delivery_estimate][minimum][value]', '3');
  params.append('shipping_options[2][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
  params.append('shipping_options[2][shipping_rate_data][delivery_estimate][maximum][value]', '7');

  items.forEach((item, i) => {
    const p = `line_items[${i}]`;
    params.append(`${p}[price_data][currency]`, 'aud');
    params.append(`${p}[price_data][product_data][name]`, item.name);
    if (item.condition) {
      params.append(`${p}[price_data][product_data][description]`, item.condition);
    }
    if (item.image) {
      params.append(`${p}[price_data][product_data][images][]`, item.image);
    }
    params.append(`${p}[price_data][unit_amount]`, Math.round(item.price * 100));
    params.append(`${p}[quantity]`, item.quantity || 1);
  });

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await stripeRes.json();

  if (session.error) {
    return res.status(400).json({ error: session.error.message });
  }

  return res.json({ url: session.url });
}

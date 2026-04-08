// High End Fire — Cloudflare Worker
// Handles /api/checkout and serves static assets for everything else

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/checkout' && request.method === 'POST') {
      return handleCheckout(request, env);
    }

    // Serve static assets for all other requests
    return env.ASSETS.fetch(request);
  },
};

async function handleCheckout(request, env) {
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe not configured' }, 500);
  }

  let items, origin;
  try {
    ({ items, origin } = await request.json());
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!items || !items.length) {
    return json({ error: 'No items in cart' }, 400);
  }

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/#pokemon`);

  const countries = ['AU', 'US', 'GB', 'NZ', 'JP', 'CA', 'DE', 'FR', 'SG'];
  countries.forEach((c) =>
    params.append('shipping_address_collection[allowed_countries][]', c)
  );

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
    return json({ error: session.error.message }, 400);
  }

  return json({ url: session.url });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

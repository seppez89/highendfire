// Cloudflare Pages Function — creates a Stripe Checkout Session
// Set STRIPE_SECRET_KEY in Cloudflare Pages > Settings > Environment Variables

export async function onRequestPost(context) {
  const { request, env } = context;

  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { items, origin } = await request.json();

    if (!items || !items.length) {
      return new Response(JSON.stringify({ error: 'No items in cart' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build Stripe line_items from cart
    const line_items = items.map((item) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: item.condition || '',
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity || 1,
    }));

    // Create Stripe Checkout Session via API
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/#pokemon`);
    params.append('currency', 'aud');
    params.append('shipping_address_collection[allowed_countries][]', 'AU');
    params.append('shipping_address_collection[allowed_countries][]', 'US');
    params.append('shipping_address_collection[allowed_countries][]', 'GB');
    params.append('shipping_address_collection[allowed_countries][]', 'NZ');
    params.append('shipping_address_collection[allowed_countries][]', 'JP');
    params.append('shipping_address_collection[allowed_countries][]', 'CA');
    params.append('shipping_address_collection[allowed_countries][]', 'DE');
    params.append('shipping_address_collection[allowed_countries][]', 'FR');
    params.append('shipping_address_collection[allowed_countries][]', 'SG');

    line_items.forEach((item, i) => {
      params.append(`line_items[${i}][price_data][currency]`, item.price_data.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, item.price_data.product_data.name);
      if (item.price_data.product_data.description) {
        params.append(`line_items[${i}][price_data][product_data][description]`, item.price_data.product_data.description);
      }
      if (item.price_data.product_data.images.length) {
        params.append(`line_items[${i}][price_data][product_data][images][]`, item.price_data.product_data.images[0]);
      }
      params.append(`line_items[${i}][price_data][unit_amount]`, item.price_data.unit_amount);
      params.append(`line_items[${i}][quantity]`, item.quantity);
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

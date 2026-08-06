// High End Fire — server-side product catalogue
//
// Products are authored as `data-product-*` attributes on the cards in
// index.html, which is the only place they exist. Rather than duplicate them
// into a second list that would silently drift out of date, the server parses
// that same file and treats it as the price authority. Nothing a browser sends
// about a product is trusted — only the product id and how many of it.
//
// The file is read from disk (bundled via `functions.includeFiles` in
// vercel.json). If that ever fails, it falls back to fetching the canonical
// site over HTTP — deliberately a hardcoded domain, never the caller's
// `origin`, which would let anyone supply their own price list.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = 'https://highendfire.shop';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = null; // { products: Map<string, Product>, loadedAt: number }

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(str) {
  return str.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] || m);
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? decodeEntities(match[1]) : null;
}

// Pull every product card's opening tag out of the page and read its data
// attributes. Cards without a product id (section wrappers, placeholders) are
// skipped.
export function parseCatalog(html) {
  const products = new Map();
  const cardTags = html.match(/<div\b[^>]*\bclass="[^"]*\bproduct-card\b[^"]*"[^>]*>/g) || [];

  for (const tag of cardTags) {
    const id = attr(tag, 'data-product-id');
    if (!id) continue;

    const price = parseFloat(attr(tag, 'data-product-price'));
    if (!isFinite(price) || price <= 0) continue;

    const rawStock = parseInt(attr(tag, 'data-stock'), 10);

    products.set(id, {
      id,
      name: attr(tag, 'data-product-name') || id,
      price,
      condition: attr(tag, 'data-product-condition') || '',
      image: attr(tag, 'data-product-image') || '',
      stock: isNaN(rawStock) ? 1 : Math.max(0, rawStock),
      // Top-of-the-case pieces are sold in conversation. They have no Add to Cart
      // button, but the button is only the front door — a cart saved before the
      // switch, or a hand-made request, would otherwise still reach checkout.
      enquiryOnly: attr(tag, 'data-enquiry-only') !== null,
    });
  }

  return products;
}

async function loadIndexHtml() {
  const candidates = [
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), '../index.html'),
  ];

  for (const file of candidates) {
    try {
      return await readFile(file, 'utf8');
    } catch {
      // try the next location
    }
  }

  const res = await fetch(`${SITE_URL}/index.html`);
  if (!res.ok) throw new Error(`Catalogue fetch failed: HTTP ${res.status}`);
  return res.text();
}

export async function getCatalog() {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.products;
  }

  const products = parseCatalog(await loadIndexHtml());
  if (products.size === 0) {
    // A parse that finds nothing means the page shape changed. Serving a stale
    // catalogue beats rejecting every checkout.
    if (cache) return cache.products;
    throw new Error('Catalogue is empty');
  }

  cache = { products, loadedAt: Date.now() };
  return products;
}

// Resolve a browser cart against the catalogue. Returns priced line items, or a
// caller-facing error describing the first thing that no longer lines up.
export async function priceCart(items) {
  const catalog = await getCatalog();
  const lineItems = [];

  for (const item of items) {
    const id = typeof item?.id === 'string' ? item.id : null;
    if (!id) return { error: 'Cart contains an unrecognised item.' };

    const product = catalog.get(id);
    if (!product) {
      return { error: 'One of the items in your cart is no longer listed. Please refresh the page.' };
    }

    if (product.enquiryOnly) {
      return {
        error: `${product.name} is sold by enquiry rather than through the cart. Please get in touch and we'll arrange it directly.`,
      };
    }

    if (product.stock === 0) {
      return { error: `${product.name} has sold out.` };
    }

    const quantity = Math.floor(Number(item.quantity) || 1);
    if (quantity < 1) return { error: 'Invalid quantity.' };

    if (quantity > product.stock) {
      return {
        error: `Only ${product.stock} × ${product.name} ${product.stock === 1 ? 'is' : 'are'} available. Please adjust your cart.`,
      };
    }

    lineItems.push({ product, quantity });
  }

  return { lineItems };
}

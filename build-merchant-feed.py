#!/usr/bin/env python3
"""Build the Google Merchant Center product feed at /feeds/products.xml.

Reads the same source of truth as everything else — the live product markup in
index.html — so feed price and availability can never drift from the page
Google lands on. Price/availability mismatch is a top disapproval cause.

Only products with their own landing page under /products/ are included, since
Google requires the link to resolve to that specific item.

Run from the repo root:  python3 build-merchant-feed.py
"""
import json, os, re, html
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.abspath(__file__))
SITE = "https://highendfire.com.au"
FEED = os.path.join(REPO, "feeds", "products.xml")

import importlib.util
spec = importlib.util.spec_from_file_location("bpp", os.path.join(REPO, "build-product-pages.py"))
bpp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bpp)


def esc(t):
    return html.escape(html.unescape(re.sub(r"<[^>]+>", "", t)).strip(), quote=False)


def build():
    s = bpp.load_index()
    products = bpp.parse_products(s)
    ids = {k: v for k, v in json.load(
        open(os.path.join(REPO, "products-identifiers.json"))).items()
        if not k.startswith("_") and v}

    items = []
    skipped = []
    for slug in bpp.PILOT:
        if not os.path.exists(os.path.join(REPO, "products", f"{slug}.html")):
            skipped.append((slug, "no landing page"))
            continue
        p = products.get(slug)
        if not p:
            skipped.append((slug, "not in index.html"))
            continue

        imgs = bpp.gallery_for(slug) or [p["image"]]
        # prefer the .jpg twin for image_link: WebP is accepted but JPEG is the
        # safest format across every Google surface
        def prefer_jpg(path):
            j = re.sub(r"\.webp$", ".jpg", path)
            return j if os.path.exists(os.path.join(REPO, j)) else path
        imgs = [prefer_jpg(i) for i in imgs]
        ident = ids.get(slug, {})
        title = esc(p["name"])[:150]
        desc = esc(p["desc"])[:5000]

        x = [
            f"<g:id>{esc(slug)}</g:id>",
            f"<g:title>{title}</g:title>",
            f"<g:description>{desc}</g:description>",
            f"<g:link>{SITE}/products/{slug}</g:link>",
            f"<g:image_link>{SITE}/{imgs[0]}</g:image_link>",
        ]
        for extra in imgs[1:11]:
            x.append(f"<g:additional_image_link>{SITE}/{extra}</g:additional_image_link>")
        x += [
            "<g:condition>new</g:condition>",
            f"<g:availability>{'in_stock' if p['stock'] > 0 else 'out_of_stock'}</g:availability>",
            f"<g:price>{p['price']}.00 AUD</g:price>",
            "<g:brand>Pokemon</g:brand>",
            "<g:google_product_category>Toys &amp; Games &gt; Games &gt; Card Games</g:google_product_category>",
            "<g:product_type>Pokemon &gt; Sealed Product</g:product_type>",
        ]
        if ident.get("gtin"):
            x.append(f"<g:gtin>{ident['gtin']}</g:gtin>")
        if ident.get("mpn"):
            x.append(f"<g:mpn>{ident['mpn']}</g:mpn>")
        # Only claim an identifier exists when we actually hold a real one. A
        # wrong GTIN/MPN is worse than none — it matches your listing to
        # somebody else's product.
        if not (ident.get("gtin") or ident.get("mpn")):
            x.append("<g:identifier_exists>no</g:identifier_exists>")
        x += [
            "<g:shipping>"
            "<g:country>AU</g:country>"
            "<g:service>Standard tracked</g:service>"
            "<g:price>10.00 AUD</g:price>"
            "</g:shipping>",
            f"<g:shipping_weight>{'1.2' if 'booster-box' in slug else '0.4'} kg</g:shipping_weight>",
        ]
        items.append("    <item>\n      " + "\n      ".join(x) + "\n    </item>")

    os.makedirs(os.path.dirname(FEED), exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>High End Fire Collectables — Sealed Product</title>
    <link>{SITE}</link>
    <description>Sealed Pokemon TCG product in stock in Australia. Prices in AUD.</description>
    <lastBuildDate>{now}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>
"""
    with open(FEED, "w", encoding="utf-8") as f:
        f.write(xml)

    print(f"  {len(items)} items -> feeds/products.xml")
    for slug, why in skipped:
        print(f"  !! skipped {slug}: {why}")
    n_id = sum(1 for slug in bpp.PILOT if ids.get(slug))
    print(f"  {n_id} with a real identifier, {len(items)-n_id} as identifier_exists=no")
    return len(items)


if __name__ == "__main__":
    build()

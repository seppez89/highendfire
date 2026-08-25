#!/usr/bin/env python3
"""Generate one landing page per product, at /products/<slug>.

Google Merchant Center requires each product in the feed to have its own
landing page. Every product on this site lives as an anchor on index.html,
and Google strips URL fragments when crawling, so a feed built on /#slug
would look like 64 products sharing one page and get disapproved as a
generic landing page.

These pages reuse the site's own header, footer, CSS and scripts. cart.js
finds products with `.product-card[data-product-id]` on DOM ready, so a page
carrying one product card gets a working Add to Cart with no JS changes.

Run from the repo root:  python3 build-product-pages.py
"""
import json, os, re, sys, html

REPO = os.path.dirname(os.path.abspath(__file__))
SITE = "https://highendfire.com.au"
OUTDIR = os.path.join(REPO, "products")

BRAND_BY_SECTION = {
    "pokemon": "Pokemon",
    "dragonball": "Dragon Ball Super Card Game",
    "onepiece": "One Piece Card Game",
    "retro": "Retro Gaming",
}

# Pilot scope: modern English sealed product that is in stock and buyable.
# Enquiry-only vintage one-offs are deliberately excluded — they are not
# Shopping products and have no standard GTIN.
# Set to True to rebuild only the sealed pilot. False builds every product,
# which is what Merchant Center needs and what gives each item its own page
# to rank on instead of one homepage competing for everything.
ONLY_PILOT = False

PILOT = [
    "sv10-destined-rivals-booster-box",
    "ascended-heroes-booster-bundle",
    "pitch-black-booster-box",
    "pitch-black-etb",
    "pitch-black-booster-bundle",
    "chaos-rising-booster-bundle",
]


def load_index():
    with open(os.path.join(REPO, "index.html"), encoding="utf-8") as f:
        return f.read()


def slice_between(s, start, end):
    i = s.index(start)
    j = s.index(end, i) + len(end)
    return s[i:j]


def sections_in(s):
    return [(m.start(), m.group(1)) for m in
            re.finditer(r'<section class="products-section[^"]*"[^>]*id="([^"]+)"', s)]


def parse_products(s):
    out = {}
    secs = sections_in(s)
    for m in re.finditer(r'<div id="([^"]+)"[^>]*class="product-card[^"]*"[^>]*>', s):
        slug = m.group(1)
        block = re.search(
            r'( *<div id="%s".*?\n        </div>\n)' % re.escape(slug), s, re.S)
        if not block:
            continue
        b = block.group(1)
        tag = re.search(r'<div id="%s"[^>]*>' % re.escape(slug), b).group(0)

        def attr(name):
            mm = re.search(r'%s="([^"]*)"' % re.escape(name), tag)
            return mm.group(1) if mm else None

        name = attr("data-product-name")
        if not name:
            continue
        desc = re.search(r'<p class="product-card__desc">(.*?)</p>', b, re.S)
        h3 = re.search(r'<h3 class="product-card__name">(.*?)</h3>', b, re.S)
        alt = re.search(r'<img[^>]*alt="([^"]*)"', b)
        sec = [name for start, name in secs if start < m.start()]
        out[slug] = dict(
            slug=slug,
            section=sec[-1] if sec else "pokemon",
            name=name,
            title=re.sub(r"\s+", " ", h3.group(1)).strip() if h3 else name,
            desc=re.sub(r"\s+", " ", desc.group(1)).strip() if desc else "",
            price=int(attr("data-product-price") or 0),
            # Regular ("was") price, present only while an item is on sale.
            # data-product-price stays the price actually charged, because
            # api/_catalog.js reads it as the pricing authority.
            rrp=int(attr("data-product-rrp") or 0),
            stock=int(attr("data-stock") or 0),
            condition=attr("data-product-condition") or "",
            image=attr("data-product-image") or "",
            alt=alt.group(1) if alt else name,
            block=b,
            enquiry="data-enquiry-only" in tag,
        )
    return out


def gallery_for(slug):
    with open(os.path.join(REPO, "js", "lightbox.js"), encoding="utf-8") as f:
        js = f.read()
    m = re.search(r"'%s':\s*\[(.*?)\]" % re.escape(slug), js, re.S)
    if not m:
        return []
    # lightbox.js paths are root-relative ('/images/...'); callers build URLs as
    # SITE + '/' + path, so normalise the leading slash off here.
    return [g.lstrip("/") for g in
            re.findall(r"'/?(?:\./)?(images/products/[^']+)'", m.group(1))]


def strip_tags(t):
    return html.unescape(re.sub(r"<[^>]+>", "", t)).strip()


PAGE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title_tag}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#e05c2a">

  <meta property="og:type" content="product">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{site}/{image}">
  <meta property="og:site_name" content="High End Fire Collectables">
  <meta property="product:price:amount" content="{price}">
  <meta property="product:price:currency" content="AUD">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{meta_desc}">
  <meta name="twitter:image" content="{site}/{image}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png">
  <link rel="manifest" href="/manifest.json">

  <script type="application/ld+json">
  {product_ld}
  </script>
  <script type="application/ld+json">
  {crumb_ld}
  </script>
</head>
<body>
{header}
  <main>
    <section class="products-section" id="product">
      <div class="container">
        <nav class="section-label" aria-label="Breadcrumb" style="display:block;margin-bottom:22px">
          <a href="/" style="color:inherit">Home</a> &nbsp;/&nbsp;
          <a href="/#{section}" style="color:inherit">{section_label}</a> &nbsp;/&nbsp; {title_plain}
        </nav>
        <div class="products-grid" style="grid-template-columns:minmax(0,1fr);max-width:720px;margin:0 auto">
{block}        </div>

        <div style="max-width:720px;margin:34px auto 0;text-align:center">
          <p style="color:#9a979b;font-size:15px;line-height:1.7">
            $10 tracked shipping Australia-wide. International Standard $50 AUD,
            International Express $80 AUD. Every order is tracked and securely packaged.
            See our <a href="/refund" style="color:#E84425">returns policy</a>.
          </p>
          <p style="margin-top:26px">
            <a href="/#{section}" class="btn btn--outline btn--sm">&larr; Back to all {section_label}</a>
          </p>
        </div>
      </div>
    </section>
  </main>
{footer}
  <script src="/js/cart.js" defer></script>
  <script src="/js/lightbox.js" defer></script>
  <script src="/js/main.js" defer></script>
</body>
</html>
"""


def build():
    s = load_index()
    header = slice_between(s, "<header", "</header>")
    footer = slice_between(s, "<footer", "</footer>")
    # product pages sit at /products/<slug>; make root-relative so links resolve
    header = re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', header)
    footer = re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', footer)

    products = parse_products(s)
    ids = {}
    id_path = os.path.join(REPO, "products-identifiers.json")
    if os.path.exists(id_path):
        ids = {k: v for k, v in json.load(open(id_path)).items()
               if not k.startswith("_") and v}

    os.makedirs(OUTDIR, exist_ok=True)
    made = []
    targets = PILOT if ONLY_PILOT else list(products.keys())
    for slug in targets:
        p = products.get(slug)
        if not p:
            print(f"  !! {slug} not found in index.html", file=sys.stderr)
            continue

        block = p["block"]
        # root-relative asset paths, and drop the homepage anchor id to avoid
        # two elements sharing an id if this page is ever embedded
        block = re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', block)
        # data-product-image feeds the cart drawer thumbnail; left relative it
        # resolves to /products/images/... and 404s
        block = re.sub(r'data-product-image="(?!https?:|/)', 'data-product-image="/', block)

        imgs = gallery_for(slug) or [p["image"]]
        title_plain = strip_tags(p["title"])
        desc_plain = strip_tags(p["desc"])
        meta_desc = (desc_plain[:150].rsplit(" ", 1)[0] + "…") if len(desc_plain) > 155 else desc_plain
        url = f"{SITE}/products/{slug}"

        section = p["section"]
        is_sealed = bool(re.search(r"sealed|booster|elite trainer|bundle|\bETB\b|display box",
                                   p["name"], re.I))
        kind = ("Sealed " if is_sealed else "") + {
            "pokemon": "Pokemon Cards", "dragonball": "Dragon Ball Cards",
            "onepiece": "One Piece Cards", "retro": "Retro Gaming",
        }.get(section, "Pokemon Cards")
        kind = kind.replace("Sealed Retro Gaming", "Retro Gaming")
        section_label = {"pokemon": "Pokemon", "dragonball": "Dragon Ball",
                         "onepiece": "One Piece", "retro": "Retro Gaming"}.get(
                             section, "Pokemon")

        offer = {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "AUD",
            "price": str(p["price"]),
            "availability": "https://schema.org/InStock" if p["stock"] > 0
                            else "https://schema.org/SoldOut",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {"@id": f"{SITE}/#store"},
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingDestination": {"@type": "DefinedRegion", "addressCountry": "AU"},
                "shippingRate": {"@type": "MonetaryAmount", "value": "10", "currency": "AUD"},
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "AU",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 30,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/ReturnShippingFees",
            },
        }
        product_ld = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p["name"],
            "description": desc_plain,
            "image": [f"{SITE}/{i}" for i in imgs],
            "brand": {"@type": "Brand", "name": BRAND_BY_SECTION.get(section, "Pokemon")},
            "category": f"{section_label} Trading Cards",
            "sku": "HEF-" + slug.upper(),
            "offers": offer,
        }
        ident = ids.get(slug)
        if ident:
            if ident.get("gtin"):
                product_ld["gtin"] = str(ident["gtin"])
            if ident.get("mpn"):
                product_ld["mpn"] = str(ident["mpn"])

        crumb_ld = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE},
                {"@type": "ListItem", "position": 2, "name": section_label,
                 "item": f"{SITE}/#{section}"},
                {"@type": "ListItem", "position": 3, "name": title_plain, "item": url},
            ],
        }

        page = PAGE.format(
            title_tag=f"{title_plain} | Buy {kind} Australia — High End Fire",
            og_title=title_plain,
            meta_desc=html.escape(meta_desc, quote=True),
            url=url, site=SITE, image=p["image"], price=p["price"],
            product_ld=json.dumps(product_ld, indent=2, ensure_ascii=False).replace("\n", "\n  "),
            crumb_ld=json.dumps(crumb_ld, indent=2, ensure_ascii=False).replace("\n", "\n  "),
            header=header, footer=footer, block=block,
            section=section, section_label=section_label, title_plain=html.escape(title_plain),
        )
        path = os.path.join(OUTDIR, f"{slug}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)
        made.append((slug, p["price"], p["stock"], bool(ident)))
        print(f"  ✓ /products/{slug}  ${p['price']}  x{p['stock']}  id={'mpn' if ident else 'none'}")

    print(f"\n{len(made)} product pages written to {OUTDIR}")
    return made


if __name__ == "__main__":
    build()

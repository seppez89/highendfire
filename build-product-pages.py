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

# Every product gets its own page — that is pure SEO upside and costs nothing.
# The Merchant Center FEED is a separate, narrower question: see SEALED_PRODUCTS.
ONLY_PILOT = False

# Sealed product, listed explicitly rather than pattern-matched on the name.
# Matching on words like "box" or "booster" is not safe: it catches the PSA 9
# "Gold Star ... Gift Box" single and the "Precious Collector Box" promo CARD,
# both of which are graded/condition-listed singles, not sealed retail product.
# Putting either in a Shopping feed as new sealed stock would misdescribe them.
#
# Only in-stock, buyable sealed lines belong here. The One Piece Romance Dawn
# sealed box is genuinely sealed but sits above the enquiry threshold, so the
# feed builder drops it anyway.
SEALED_PRODUCTS = [
    "sv10-destined-rivals-booster-box",
    "ascended-heroes-booster-bundle",
    "pitch-black-booster-box",
    "pitch-black-etb",
    "pitch-black-booster-bundle",
    "chaos-rising-booster-bundle",
    "lost-abyss-s11-booster-box-jp",
    "25th-anniversary-collection-s8a-booster-box-jp",
    "paradigm-trigger-s12-booster-box-jp",
    "terastal-festival-ex-sv8a-booster-box-jp",
    "storm-emeralda-m6-booster-box-jp",
    "triple-beat-sv1a-booster-box-jp",
    "mega-dream-ex-m2a-booster-box-jp",
    "mega-starter-set-bundle-jp",
    "abyss-eye-m5-booster-box-jp",
    "stellar-miracle-sv7-deck-build-box-jp",
]

# Back-compat alias — build() still reads PILOT when ONLY_PILOT is on.
PILOT = SEALED_PRODUCTS


CATALOGUE = "shop.html"   # every product card is authored here (see its header comment)

# Where each catalogue section's own page lives.
SECTION_URL = {"pokemon": "/pokemon-cards", "dragonball": "/dragon-ball-cards",
               "onepiece": "/one-piece-cards"}


def load_catalogue():
    with open(os.path.join(REPO, CATALOGUE), encoding="utf-8") as f:
        return f.read()


# Older scripts (the Merchant feed builder) still call this name.
load_index = load_catalogue


def load_chrome():
    """Site header and footer. index.html holds the master copy of both."""
    with open(os.path.join(REPO, "index.html"), encoding="utf-8") as f:
        s = f.read()
    header = slice_between(s, "<header", "</header>")
    footer = slice_between(s, "<footer", "</footer>")
    fix = lambda c: fix_anchor_links(
        re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', c))
    return fix(header), fix(footer)


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
            tags=(attr("data-tags") or "").split(),
            set=attr("data-set") or "",
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


ENQUIRY_THRESHOLD = 3000  # mirrors js/cart.js — above this the site shows no price


def fix_anchor_links(chunk):
    """Header and footer are lifted from index.html, where '#pokemon' etc. are
    on-page anchors. On /products/<slug> those ids don't exist, so every nav
    link, the logo and Shop Now went nowhere. Point them back at the homepage."""
    chunk = re.sub(r'href="#"', 'href="/"', chunk)
    return re.sub(r'href="#([^"]+)"', r'href="/#\1"', chunk)


def title_tag_for(name):
    """Longest form that fits Google's ~60 character title width."""
    for t in (f"{name} | Buy in Australia | High End Fire",
              f"{name} | High End Fire"):
        if len(t) <= 62:
            return t
    return name


def thumb_of(p):
    m = re.search(r'<img[^>]*src="([^"]+)"', p["block"])
    return ("/" + m.group(1).lstrip("/")) if m else None


def related_for(p, products, n=4):
    """In-stock pieces from the same shelf, closest in price first. Gives every
    product page real internal links instead of being a dead end."""
    pool = [q for q in products.values()
            if q["slug"] != p["slug"] and q["stock"] > 0 and thumb_of(q)]
    same = [q for q in pool if q["section"] == p["section"]]
    if len(same) < n:
        same += [q for q in pool if q not in same]
    # Sealed boxes suggest other sealed boxes, singles suggest singles.
    sealed = lambda q: q["slug"] in SEALED_PRODUCTS
    same.sort(key=lambda q: (q["section"] != p["section"], sealed(q) != sealed(p),
                             abs(q["price"] - p["price"])))
    picks = same[:n]
    if not picks:
        return ""
    tiles = []
    for q in picks:
        name = html.escape(strip_tags(q["title"]))
        priced = not q["enquiry"] and q["price"] <= ENQUIRY_THRESHOLD
        price = f'${q["price"]:,} AUD' if priced else "Enquire for price"
        tiles.append(
            f'          <a class="related__item" href="/products/{q["slug"]}">\n'
            f'            <img src="{thumb_of(q)}" alt="{html.escape(q["alt"], quote=True)}" width="390" height="390" loading="lazy">\n'
            f'            <span class="related__name">{name}</span>\n'
            f'            <span class="related__price">{price}</span>\n'
            f'          </a>')
    return ('        <aside class="related" aria-labelledby="relatedTitle">\n'
            '          <h2 class="related__title" id="relatedTitle">More like this</h2>\n'
            '          <div class="related__grid">\n' + "\n".join(tiles) +
            '\n          </div>\n        </aside>\n')


def short_figure(vid, title, buy=None):
    """One YouTube Short as a click-to-play facade: YouTube's thumbnail and a
    play button. js/main.js swaps in the nocookie player on click."""
    t = html.escape(title, quote=True)
    out = (f'          <figure class="short">\n'
           f'            <button type="button" class="yt-facade" data-yt="{vid}" aria-label="Play: {t}">\n'
           f'              <img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy">\n'
           f'              <span class="yt-facade__play" aria-hidden="true"></span>\n'
           f'            </button>\n'
           f'            <figcaption class="short__title">{t}</figcaption>\n')
    if buy:
        out += f'            <a class="short__buy" href="/products/{buy}">Buy this card &rarr;</a>\n'
    return out + '          </figure>'


def short_titles(sc):
    return dict(sc.SHORTS + sc.SHORTS_EXTRA)


def seen_on_block(slug, sc):
    ids = sc.PRODUCT_SHORTS.get(slug)
    if not ids:
        return ""
    titles = short_titles(sc)
    figs = "\n".join(short_figure(v, titles.get(v, "High End Fire on YouTube")) for v in ids)
    return ('        <section class="seen-on" aria-labelledby="seenOnTitle">\n'
            '          <h2 class="product-info__title" id="seenOnTitle">Seen on our channel</h2>\n'
            '          <div class="shorts-row shorts-row--scroll">\n' + figs +
            '\n          </div>\n'
            f'          <p class="shorts-more"><a href="{sc.YOUTUBE}" target="_blank" rel="noopener">More on YouTube</a></p>\n'
            '        </section>\n')


def firstdibs_block(source):
    """The First dibs signup. Posts to /api/subscribe through js/watchlist.js;
    `source` tags where the signup came from."""
    return f'''  <section class="watchlist-cta firstdibs" aria-labelledby="firstdibsTitle">
    <div class="container">
      <div class="watchlist-cta__card">
        <span class="section-label">EMAIL LIST</span>
        <h2 class="watchlist-cta__title" id="firstdibsTitle">First <span class="gradient-text">dibs</span></h2>
        <p class="watchlist-cta__subhead">New stock and show pickups, 24 hours before anyone else. One email when there's something worth seeing. No spam.</p>
        <form class="watchlist-form" action="/api/subscribe" method="post" novalidate data-watchlist-form>
          <input type="hidden" name="source" value="{html.escape(source, quote=True)}">
          <input type="text" name="_honey" class="watchlist-form__honey" tabindex="-1" autocomplete="off" aria-hidden="true">
          <input type="email" name="email" class="watchlist-form__input" required placeholder="you@example.com" aria-label="Email address" autocomplete="email">
          <button type="submit" class="btn btn--primary watchlist-form__submit">Get first dibs</button>
        </form>
        <p class="watchlist-cta__fineprint" data-watchlist-fineprint>Unsubscribe any time.</p>
      </div>
    </div>
  </section>'''


def buy_help(sc):
    """Who's selling, a phone number and the Whatnot door, next to the buy button."""
    return f'''            <div class="buy-help">
              <div class="sold-by">
                <img src="/images/jonathon-headshot.jpg" alt="Jonathon, who runs High End Fire" width="300" height="300" loading="lazy">
                <span class="sold-by__text"><strong>Sold by Jonathon, Adelaide</strong>Packed and posted by me.</span>
              </div>
              <p>Questions? Text <a href="tel:{sc.PHONE_TEL}">{sc.PHONE}</a></p>
              <p>Rather bid live? <a href="{sc.WHATNOT}" target="_blank" rel="noopener">Catch us on Whatnot</a></p>
            </div>
'''


def _content():
    """site_content.py holds the published copy. Loaded by path so this script
    still works when it is itself imported from build-site.py."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "site_content", os.path.join(REPO, "site_content.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def condition_note(p, sc):
    """Plain-English note for the listing's condition, plus the PSA cert link
    when the description quotes a certification number."""
    cond = (p["condition"] or "").upper().replace("–", "-").replace("—", "-")
    psa = re.match(r"PSA\s*(\d+)", cond)
    if not psa and "graded" in p["tags"]:      # grade only in the listing name
        psa = re.search(r"PSA\s*(\d+)", p["name"].upper())
    if psa:
        n = int(psa.group(1))
        name = sc.PSA_GRADES.get(n)
        note = (f"Graded PSA {n}" + (f" ({name})" if name else "") +
                " and sealed in its PSA case. PSA grades cards from 1 to 10.")
        cert = re.search(r"cert\.?\s*(?:no\.?|number|#)?\s*(\d{7,9})", strip_tags(p["desc"]), re.I)
        if cert:
            note += (f' Certification number {cert.group(1)}: '
                     f'<a href="https://www.psacard.com/cert/{cert.group(1)}" target="_blank" rel="noopener">'
                     'check it on PSA\'s website</a>.')
        return note, False
    if "SEALED" in cond or "sealed" in p["tags"]:
        return sc.CONDITION_NOTES["SEALED"], False
    for key in ("NM-LP", "LIGHTLY PLAYED", "NEAR MINT", "MP", "MINT"):
        if key in cond or (key == "NEAR MINT" and cond.startswith("NM")):
            return sc.CONDITION_NOTES[key], True
    return sc.CONDITION_NOTES[""], True


def info_block(p, sc, section_label, price_hidden):
    """Everything under the stage: details table, condition, the set, how
    buying works. Built only from the card's own data and site_content.py."""
    esc = html.escape
    sealed = "sealed" in p["tags"]
    graded = "graded" in p["tags"]
    kind = "Sealed product" if sealed else ("PSA graded single" if graded else "Raw single")
    game = {"Pokemon": "Pokemon TCG"}.get(BRAND_BY_SECTION.get(p["section"], "Pokemon"),
                                          BRAND_BY_SECTION.get(p["section"], "Pokemon"))
    rows = [("Game", game), ("Type", kind)]
    if p["condition"]:
        rows.append(("Condition", esc(p["condition"].title().replace("Psa", "PSA").replace("Nm", "NM")
                                      .replace("Lp", "LP").replace("Mp-", "MP-"))))
    if "japanese" in p["tags"]:
        rows.append(("Language", "Japanese"))
    if "vintage" in p["tags"]:
        rows.append(("Era", "Vintage (1996 to 2003)"))
    if p["stock"] > 0:
        rows.append(("Availability", "In stock" + (f" ({p['stock']} available)" if p["stock"] > 1 else " (1 available)")))
    else:
        rows.append(("Availability", "Sold"))
    if p["stock"] > 0:
        rows.append(("Price", "By enquiry" if price_hidden else f"${p['price']:,} AUD"))
    elif not price_hidden:
        rows.append(("Listed at", f"${p['price']:,} AUD"))
    rows.append(("Ships from", "Adelaide, Australia"))
    rows.append(("SKU", "HEF-" + p["slug"].upper()))
    table = "\n".join(f'              <div class="spec__row"><dt>{k}</dt><dd>{v}</dd></div>' for k, v in rows)

    note, raw = condition_note(p, sc)
    cond = f'            <p>{note}</p>\n'
    if raw:
        cond += f'            <p>{sc.RAW_FOOTNOTE}</p>\n'

    about = ""
    if p["set"] in sc.SETS:
        name, text = sc.SETS[p["set"]]
        about = (f'          <div class="product-info__block">\n'
                 f'            <h2 class="product-info__title">About {esc(name)}</h2>\n'
                 f'            <p>{esc(text)}</p>\n'
                 f'          </div>\n')
    elif p["set"]:
        print(f"  ! {p['slug']}: data-set=\"{p['set']}\" has no entry in site_content.py SETS", file=sys.stderr)

    buying = list(sc.BUYING)
    if p["stock"] > 0 and price_hidden:
        buying.insert(0, sc.BUYING_ENQUIRY)
    if sealed or graded:   # the toploader line is about raw singles, not boxes or slabs
        buying = [(k, v.split(" Singles ship")[0]) if k == "Packaging" else (k, v) for k, v in buying]
    buy = "\n".join(f'              <div class="spec__row"><dt>{k}</dt><dd>{v}</dd></div>' for k, v in buying)

    return f'''        <div class="product-info">
          <div class="product-info__block">
            <h2 class="product-info__title">Details</h2>
            <dl class="spec">
{table}
            </dl>
          </div>
          <div class="product-info__block">
            <h2 class="product-info__title">Condition</h2>
{cond}          </div>
{about}          <div class="product-info__block product-info__block--wide">
            <h2 class="product-info__title">Buying from High End Fire</h2>
            <dl class="spec">
{buy}
            </dl>
          </div>
        </div>
'''


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
{price_meta}  <meta name="twitter:card" content="summary_large_image">
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
  <!-- Vercel Web Analytics -->
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/js/source-tracking.js"></script>
</head>
<body>
{header}
  <main>
    <section class="products-section product-page" id="product">
      <div class="container">
        <nav class="section-label" aria-label="Breadcrumb" style="display:block;margin-bottom:22px">
          <a href="/" style="color:inherit">Home</a> &nbsp;/&nbsp;
          <a href="{section_url}" style="color:inherit">{section_label}</a> &nbsp;/&nbsp; {title_plain}
        </nav>
        <div class="product-stage">
{block}        </div>
{gallery_btn}{info}
{seen_on}{related}
        <p class="product-page__back">
          <a href="{section_url}" class="btn btn--outline btn--sm">&larr; Back to all {section_label}</a>
        </p>
      </div>
    </section>
{firstdibs}
  </main>
{footer}
  <script src="/js/cart.js" defer></script>
  <script src="/js/lightbox.js" defer></script>
  <script src="/js/main.js" defer></script>
  <script src="/js/effects.js" defer></script>
  <script src="/js/watchlist.js" defer></script>
</body>
</html>
"""


def build():
    s = load_catalogue()
    header, footer = load_chrome()
    sc = _content()

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

        # The product name is this page's main heading. On the homepage it is
        # one h3 among many and links here; on its own page it is the h1 and a
        # self-link would be pointless.
        block = re.sub(
            r'<h3 class="product-card__name">\s*(?:<a [^>]*>)?(.*?)(?:</a>)?\s*</h3>',
            r'<h1 class="product-card__name">\1</h1>', block, count=1, flags=re.S)
        # The card photo is the largest thing on the page, so don't lazy-load it.
        block = re.sub(r'(<img[^>]*?) loading="lazy"',
                       r'\1 loading="eager" fetchpriority="high"', block, count=1)

        # Help and contact sit inside the card, under the price and buy button.
        tail = "          </div>\n        </div>\n"
        if block.endswith(tail):
            block = block[:-len(tail)] + buy_help(sc) + tail
        else:
            print(f"  ! {slug}: card doesn't end the usual way; no contact block added", file=sys.stderr)

        # Another name the card goes by (site_content.py AKA), under the H1.
        aka = sc.AKA.get(slug)
        if aka:
            block = block.replace('</h1>', f' <span class="product-card__aka">&lsquo;{html.escape(aka)}&rsquo;</span></h1>', 1)

        # No photo of our own yet: the card shows a text tile, so there is no
        # gallery to open even if lightbox.js lists stock images for it.
        tile = "product-card__image--tile" in block

        imgs = gallery_for(slug) or [p["image"]]
        title_plain = strip_tags(p["title"])
        title_shown = f"{title_plain} '{aka}'" if aka else title_plain
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
            # Only factory-sealed product is "new". Singles are collectibles
            # that have been owned and handled, whatever their grade.
            "itemCondition": "https://schema.org/NewCondition" if "sealed" in p["tags"]
                             else "https://schema.org/UsedCondition",
            "seller": {"@id": f"{SITE}/#store"},
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingDestination": {"@type": "DefinedRegion", "addressCountry": "AU"},
                "shippingRate": {"@type": "MonetaryAmount", "value": "10", "currency": "AUD"},
            },
            # No change-of-mind returns (see /refund section 4). Australian
            # Consumer Law guarantees for faulty, damaged or not-as-described
            # items still apply and cannot be excluded — those are handled
            # under /refund sections 1, 2, 3 and 5, not as a returns window.
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "AU",
                "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
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
        # Enquiry-only pieces show "Enquire for price" on the page. An Offer
        # with a price (or the og price tags) would hand search engines the
        # figure the page deliberately leaves out, so those pages carry neither.
        price_hidden = p["enquiry"] or p["price"] > ENQUIRY_THRESHOLD
        if price_hidden:
            del product_ld["offers"]
        price_meta = "" if price_hidden else (
            f'  <meta property="product:price:amount" content="{p["price"]}">\n'
            '  <meta property="product:price:currency" content="AUD">\n')

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
                 "item": SITE + SECTION_URL.get(section, "/shop")},
                {"@type": "ListItem", "position": 3, "name": title_plain, "item": url},
            ],
        }

        page = PAGE.format(
            title_tag=html.escape(title_tag_for(title_shown)),
            seen_on=seen_on_block(slug, sc),
            firstdibs=firstdibs_block("firstdibs-product-" + slug),
            related=related_for(p, products),
            info=info_block(p, sc, section_label, price_hidden),
            gallery_btn=(
                '        <p class="product-stage__more"><button type="button" class="btn btn--outline btn--sm" '
                f'data-open-gallery>View all {len(imgs)} photos</button></p>\n' if len(imgs) > 1 and not tile else ""),
            og_title=html.escape(title_shown, quote=True),
            meta_desc=html.escape(meta_desc, quote=True),
            url=url, site=SITE, image=p["image"], price_meta=price_meta,
            product_ld=json.dumps(product_ld, indent=2, ensure_ascii=False).replace("\n", "\n  "),
            crumb_ld=json.dumps(crumb_ld, indent=2, ensure_ascii=False).replace("\n", "\n  "),
            header=header, footer=footer, block=block,
            section=section, section_label=section_label,
            section_url=SECTION_URL.get(section, "/shop"), title_plain=html.escape(title_plain),
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

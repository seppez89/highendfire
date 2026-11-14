#!/usr/bin/env python3
"""Rebuild every generated part of the site from the catalogue in shop.html.

    python3 build-site.py

Run it after ANY edit to a product card. shop.html is the only place products
are authored; this script copies them out to:

  - index.html              featured row, category tiles, old-link redirects
  - shop.html               header, footer, filter bar, structured data
  - <category>.html         one page per entry in CATEGORIES, plus sold.html
  - products/<slug>.html    via build-product-pages.py
  - videos.html             the YouTube Shorts (site_content.py SHORTS)
  - sitemap.xml             the shop + category + videos URLs
  - the other hand-written pages (sell, firelist, legal, blog ...): their
    menu, the contact bar at the top of the header, the First dibs signup
    and the footer

Anything between <!-- BUILD:x --> markers is overwritten on every run.
The site header and footer are hand-edited in index.html (the master copy).
"""
import datetime, html, importlib.util, json, os, re, sys

REPO = os.path.dirname(os.path.abspath(__file__))
SITE = "https://highendfire.com.au"

_spec = importlib.util.spec_from_file_location(
    "bpp", os.path.join(REPO, "build-product-pages.py"))
bpp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bpp)

# ---------------------------------------------------------------------------
# What goes where. Edit these lists, then re-run.
# ---------------------------------------------------------------------------

# Homepage "Featured pieces" row, in this order. Sold-out or missing slugs are
# skipped and the row is topped up from the catalogue, so it never shows gaps.
FEATURED = [
    "charizard-092-stormfront-jp-psa10",
    "mew-ex-232",
    "sv10-destined-rivals-booster-box",
    "gengar-mimikyu-gx-53-team-up",
    "25th-anniversary-collection-s8a-booster-box-jp",
    "mewtwo-holo-delta-species-psa9",
    "rayquaza-vmax-tg20-silver-tempest",
    "gyarados-6-base-set",
]
FEATURED_COUNT = 8

# Category pages. `match` decides membership from the card's section (which
# block of shop.html it sits in) and its data-tags attribute.
CATEGORIES = [
    dict(slug="pokemon-cards", chip="Pokemon", tile="Pokemon Cards",
         title="Rare Pokemon Cards for Sale Australia | High End Fire",
         h1='RARE <span class="gradient-text">POKEMON</span> CARDS',
         desc="Rare Pokemon cards for sale in Australia: vintage WOTC holos, Japanese exclusives, modern chase cards and sealed boxes. $10 tracked shipping.",
         intro="Vintage WOTC holos, Japanese exclusives, modern chase cards and sealed booster boxes. Each piece is hand-picked by a collector in Adelaide and ships tracked for $10 Australia-wide.",
         match=lambda p: p["section"] == "pokemon"),
    dict(slug="sealed-pokemon", chip="Sealed", tile="Sealed Boxes",
         title="Sealed Pokemon Booster Boxes Australia | High End Fire",
         h1='SEALED <span class="gradient-text">BOOSTER BOXES</span>',
         desc="Factory-sealed Pokemon booster boxes, Elite Trainer Boxes and bundles, English and Japanese. In stock in Adelaide, $10 tracked shipping Australia-wide.",
         intro="Factory-sealed English and Japanese booster boxes, Elite Trainer Boxes and bundles. In stock in Adelaide and shipped tracked for $10 anywhere in Australia.",
         match=lambda p: p["section"] == "pokemon" and "sealed" in p["tags"]),
    dict(slug="graded-cards", chip="Graded", tile="PSA Graded",
         title="PSA Graded Pokemon Cards Australia | High End Fire",
         h1='PSA <span class="gradient-text">GRADED</span> CARDS',
         desc="PSA graded Pokemon, Dragon Ball and One Piece cards for sale in Australia. Slabs with cert numbers, more photos or video on request.",
         intro="PSA slabs across Pokemon, Dragon Ball and One Piece. The top-end pieces are sold by enquiry, so you can ask for more photos or a video before you commit.",
         match=lambda p: "graded" in p["tags"]),
    dict(slug="japanese-pokemon-cards", chip="Japanese", tile="Japanese",
         title="Japanese Pokemon Cards Australia | High End Fire",
         h1='JAPANESE <span class="gradient-text">POKEMON</span> CARDS',
         desc="Japanese Pokemon cards and sealed booster boxes for sale in Australia: special art rares, promos, old-back vintage and Japan-only sets.",
         intro="Special art rares, promos, old-back vintage and sealed boxes from Japanese sets, including releases that never came out in English.",
         match=lambda p: p["section"] == "pokemon" and "japanese" in p["tags"]),
    dict(slug="vintage-pokemon-cards", chip="Vintage", tile="Vintage WOTC",
         title="Vintage Pokemon Cards Australia (WOTC Era) | High End Fire",
         h1='VINTAGE <span class="gradient-text">POKEMON</span> CARDS',
         desc="Vintage Pokemon cards for sale in Australia: Base Set, Jungle, Fossil, Team Rocket and Neo holos, plus Japanese old-back cards from 1996 to 2003.",
         intro="Base Set, Jungle, Fossil, Team Rocket and Neo-era holos, plus Japanese old-back cards. The original run, from 1996 to 2003.",
         match=lambda p: p["section"] == "pokemon" and "vintage" in p["tags"]),
    dict(slug="dragon-ball-cards", chip="Dragon Ball", tile="Dragon Ball",
         title="Dragon Ball Fusion World Cards Australia | High End Fire",
         h1='DRAGON BALL <span class="gradient-text">TCG</span>',
         desc="Dragon Ball Super Card Game Fusion World singles for sale in Australia: secret rares, alt arts, gold energy markers and PSA slabs.",
         intro="Dragon Ball Super Card Game: Fusion World singles. Secret rares, alternate arts, gold energy markers and graded top prizes.",
         match=lambda p: p["section"] == "dragonball"),
    dict(slug="one-piece-cards", chip="One Piece", tile="One Piece",
         title="One Piece Card Game Australia | High End Fire",
         h1='ONE PIECE <span class="gradient-text">TCG</span>',
         desc="One Piece Card Game for sale in Australia: PSA graded singles and sealed first-wave boxes, shipped tracked from Adelaide.",
         intro="One Piece Card Game singles and sealed product, including first-wave boxes.",
         match=lambda p: p["section"] == "onepiece"),
]

SOLD = dict(slug="sold", chip="Sold", tile="Sold Archive",
            title="Sold Pokemon Cards Archive | High End Fire",
            h1='SOLD <span class="gradient-text">ARCHIVE</span>',
            desc="Rare Pokemon, Dragon Ball and One Piece cards previously sold by High End Fire in Australia, with the price each piece was listed at.",
            intro="Pieces that have found a new home. The price shown is what each one was listed at. Want something similar? Get in touch and I'll keep an eye out.")

# Old homepage anchors that people and other sites still link to.
LEGACY_ANCHORS = {"pokemon": "/pokemon-cards", "dragonball": "/dragon-ball-cards",
                  "onepiece": "/one-piece-cards", "retro": "/shop",
                  "reviews": "/#about"}

# Hand-written pages that get the master contact bar, First dibs signup and
# footer. Each is tagged firstdibs-<page> in Brevo. (table.html and review.html
# are full-screen show-table pages with no site layout, so they're left out.)
CHROME_SYNC = {"sell.html": "sell", "firelist.html": "firelist",
               "vendor-editing.html": "vendor-editing", "legal.html": "legal",
               "privacy.html": "privacy", "refund.html": "refund", "terms.html": "terms",
               "success.html": "success", "sell-thanks.html": "sell-thanks",
               "blog/index.html": "blog",
               "blog/japanese-vs-english-pokemon-cards.html": "blog-japanese-vs-english",
               "blog/pokemon-30th-anniversary.html": "blog-30th-anniversary",
               "blog/romance-dawn-blue-bottom-why-it-moved.html": "blog-blue-bottom"}

# Hand-written pages whose menu links are kept in step with the master header.
NAV_SYNC = ["sell.html", "firelist.html", "vendor-editing.html", "legal.html",
            "privacy.html", "refund.html", "terms.html", "blog/index.html",
            "blog/japanese-vs-english-pokemon-cards.html",
            "blog/pokemon-30th-anniversary.html",
            "blog/romance-dawn-blue-bottom-why-it-moved.html"]


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def read(rel):
    with open(os.path.join(REPO, rel), encoding="utf-8") as f:
        return f.read()


def write(rel, text):
    with open(os.path.join(REPO, rel), "w", encoding="utf-8") as f:
        f.write(text)


def region(s, name, content, rel):
    """Replace what sits between <!-- BUILD:name --> and <!-- /BUILD:name -->."""
    pat = re.compile(r'(<!-- BUILD:%s -->)(.*?)([ \t]*<!-- /BUILD:%s -->)' % (name, name), re.S)
    if not pat.search(s):
        sys.exit(f"!! {rel} has lost its <!-- BUILD:{name} --> markers. Nothing written.")
    return pat.sub(lambda m: m.group(1) + "\n" + content.rstrip("\n") + "\n" + m.group(3), s, count=1)


def card(p):
    """A product card ready to drop into any page: asset paths made root-relative."""
    b = re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', p["block"])
    return re.sub(r'data-product-image="(?!https?:|/)', 'data-product-image="/', b)


def in_stock(p):
    return p["stock"] > 0


def thumb(p):
    return bpp.thumb_of(p)


def plain(t):
    return bpp.strip_tags(t)


def pieces(n):
    return f"{n} piece" + ("" if n == 1 else "s")


# ---------------------------------------------------------------------------
# shared blocks
# ---------------------------------------------------------------------------

def filterbar(active, counts):
    """Category chips (real links, so every category is one click from any
    other) plus the price and sort controls that js/shop.js drives."""
    chips = [("shop", "All", "/shop")] + [(c["slug"], c["chip"], "/" + c["slug"]) for c in CATEGORIES]
    out = ['      <div class="filterbar">',
           '        <nav class="chips" aria-label="Browse by category">']
    for slug, label, href in chips:
        cur = ' is-active" aria-current="page' if slug == active else ""
        out.append(f'          <a class="chip{cur}" href="{href}">{label} <span class="chip__n">{counts[slug]}</span></a>')
    cur = ' is-active" aria-current="page' if active == "sold" else ""
    out.append(f'          <a class="chip chip--quiet{cur}" href="/sold">Sold <span class="chip__n">{counts["sold"]}</span></a>')
    out += ['        </nav>',
            '        <div class="toolbar" data-toolbar>',
            '          <div class="chips chips--price" role="group" aria-label="Filter by price">',
            '            <button type="button" class="chip is-active" data-price="all" aria-pressed="true">Any price</button>',
            '            <button type="button" class="chip" data-price="0-200" aria-pressed="false">Under $200</button>',
            '            <button type="button" class="chip" data-price="200-1000" aria-pressed="false">$200 to $1,000</button>',
            '            <button type="button" class="chip" data-price="1000-" aria-pressed="false">Over $1,000</button>',
            '          </div>',
            '          <label class="sort"><span class="sort__label">Sort</span>',
            '            <select class="sort__select" data-sort aria-label="Sort products">',
            '              <option value="featured">Featured</option>',
            '              <option value="price-asc">Price: low to high</option>',
            '              <option value="price-desc">Price: high to low</option>',
            '            </select>',
            '          </label>',
            f'          <span class="toolbar__count" data-count aria-live="polite">{pieces(counts[active])}</span>',
            '        </div>',
            '      </div>']
    return "\n".join(out)


def list_ld(name, url, crumbs, items):
    crumb = {"@context": "https://schema.org", "@type": "BreadcrumbList",
             "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u}
                                 for i, (n, u) in enumerate(crumbs)]}
    lst = {"@context": "https://schema.org", "@type": "ItemList", "name": name, "url": SITE + url,
           "numberOfItems": len(items),
           "itemListElement": [{"@type": "ListItem", "position": i + 1,
                                "url": f"{SITE}/products/{p['slug']}", "name": p["name"]}
                               for i, p in enumerate(items)]}
    dump = lambda d: json.dumps(d, indent=2, ensure_ascii=False).replace("\n", "\n  ")
    return ('  <script type="application/ld+json">\n  %s\n  </script>\n'
            '  <script type="application/ld+json">\n  %s\n  </script>' % (dump(crumb), dump(lst)))


CATEGORY_PAGE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- GENERATED by build-site.py from shop.html. Do not edit: change the
       product in shop.html or the page text in build-site.py, then re-run. -->
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#e05c2a">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="High End Fire Collectables">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{og_image}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png">
  <link rel="manifest" href="/manifest.json">

{ld}
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/js/source-tracking.js"></script>
</head>
<body class="page-category">
  {header}

  <main>
  <section class="page-hero">
    <div class="container">
      <nav class="page-hero__crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/shop">Shop</a> / {crumb}</nav>
      <h1 class="page-hero__title">{h1}</h1>
      <p class="page-hero__intro">{intro}</p>
{filterbar}
    </div>
  </section>

  <section class="products-section products-section--listing">
    <div class="container">
      <div class="products-grid">
{cards}      </div>
      <p class="listing-empty" data-empty hidden>Nothing in that price range here right now. <a href="/shop">See everything in stock</a>.</p>
      <p class="listing-outro">Looking for something specific, or want more photos of a piece? <a href="/#contact">Send an enquiry</a>. Selling a collection? <a href="/sell">Get a free valuation</a>.</p>
    </div>
  </section>
{guide}
{firstdibs}
  </main>

  {footer}

  <script src="/js/cart.js"></script>
  <script src="/js/lightbox.js"></script>
  <script src="/js/main.js"></script>
  <script src="/js/shop.js"></script>
  <script src="/js/effects.js"></script>
  <script src="/js/watchlist.js" defer></script>
</body>
</html>
"""


def guide_block(slug):
    """The short buying guide under a category's grid (site_content.py GUIDES)."""
    g = bpp._content().GUIDES.get(slug)
    if not g:
        return ""
    title, parts = g
    cols = "\n".join(
        f'        <div class="listing-guide__item">\n'
        f'          <h3>{html.escape(h)}</h3>\n'
        f'          <p>{text}</p>\n'
        f'        </div>' for h, text in parts)
    return f'''  <section class="listing-guide">
    <div class="container">
      <h2 class="listing-guide__title">{html.escape(title)}</h2>
      <div class="listing-guide__grid">
{cols}
      </div>
    </div>
  </section>
'''


def category_page(cat, items, counts, header, footer):
    url = f"{SITE}/{cat['slug']}"
    og = next((f"{SITE}/{p['image'].lstrip('/')}" for p in items if p["image"]),
              f"{SITE}/images/og/og-option-b.jpg")
    return CATEGORY_PAGE.format(
        title=html.escape(cat["title"]), desc=html.escape(cat["desc"], quote=True),
        url=url, og_image=og, header=header, footer=footer,
        ld=list_ld(cat["tile"], "/" + cat["slug"],
                   [("Home", "/"), ("Shop", "/shop"), (cat["tile"], "/" + cat["slug"])], items),
        crumb=html.escape(cat["tile"]), h1=cat["h1"], intro=html.escape(cat["intro"]),
        filterbar=filterbar(cat["slug"], counts), guide=guide_block(cat["slug"]),
        firstdibs=bpp.firstdibs_block("firstdibs-" + cat["slug"]),
        cards="".join(card(p) + "\n" for p in items))


# ---------------------------------------------------------------------------
# homepage blocks
# ---------------------------------------------------------------------------

def featured_block(products, live):
    picks = [products[s] for s in FEATURED if s in products and in_stock(products[s])]
    for p in live:                      # top up if something on the list has sold
        if len(picks) >= FEATURED_COUNT:
            break
        if p not in picks and thumb(p):
            picks.append(p)
    picks = picks[:FEATURED_COUNT]
    shorts = bpp._content().PRODUCT_SHORTS

    def with_badge(p):
        c = card(p)
        if p["slug"] in shorts:
            c = c.replace('<div class="product-card__image">',
                          '<div class="product-card__image">\n'
                          f'            <a class="short-badge" href="/products/{p["slug"]}">&#9654; Seen in our Short</a>', 1)
        return c
    return f'''  <!-- GENERATED by build-site.py. These cards are copies: change the product
       in shop.html (or the FEATURED list in build-site.py) and re-run. -->
  <section class="products-section section-reveal" id="featured">
    <div class="container">
      <div class="section-header">
        <span class="section-label">FROM THE CASE</span>
        <h2 class="section-title title-underline">FEATURED <span class="gradient-text">PIECES</span></h2>
        <p class="section-desc">A few of the {len(live)} pieces in stock right now.</p>
      </div>
      <div class="products-grid products-grid--featured">
{"".join(with_badge(p) + chr(10) for p in picks)}      </div>
      <p class="section-cta"><a href="/shop" class="btn btn--primary btn--lg">Shop all {len(live)} pieces &rarr;</a></p>
    </div>
  </section>''', picks


def category_tiles(members, live):
    used, tiles = set(), []
    for cat in CATEGORIES:
        items = members[cat["slug"]]
        if not items:
            continue
        # most valuable piece not already fronting another tile
        ranked = sorted((p for p in items if thumb(p)), key=lambda p: -p["price"])
        face = next((p for p in ranked if p["slug"] not in used), ranked[0] if ranked else None)
        if not face:
            continue
        used.add(face["slug"])
        tiles.append(f'''        <a class="cat-tile" href="/{cat["slug"]}">
          <img class="cat-tile__img" src="{thumb(face)}" alt="" width="390" height="390" loading="lazy">
          <span class="cat-tile__body">
            <span class="cat-tile__name">{html.escape(cat["tile"])}</span>
            <span class="cat-tile__count">{len(items)} in stock</span>
          </span>
        </a>''')
    # An "everything" tile squares the grid off and gives the shop page a door.
    rest = sorted((p for p in live if thumb(p) and p["slug"] not in used), key=lambda p: -p["price"])
    if rest:
        tiles.append(f'''        <a class="cat-tile cat-tile--all" href="/shop">
          <img class="cat-tile__img" src="{thumb(rest[0])}" alt="" width="390" height="390" loading="lazy">
          <span class="cat-tile__body">
            <span class="cat-tile__name">Everything</span>
            <span class="cat-tile__count">{len(live)} in stock</span>
          </span>
        </a>''')
    return f'''  <!-- GENERATED by build-site.py from the CATEGORIES list. -->
  <section class="cat-section section-reveal" id="categories">
    <div class="container">
      <div class="section-header">
        <span class="section-label">BROWSE THE CASE</span>
        <h2 class="section-title title-underline">SHOP BY <span class="gradient-text">CATEGORY</span></h2>
      </div>
      <div class="cat-tiles">
{chr(10).join(tiles)}
      </div>
    </div>
  </section>'''


def hero_cards(products, live):
    """Three real cards for the homepage hero fan: the first FEATURED pieces
    that are in stock and have a cut-out at images/hero/<slug>.webp. To add
    one, cut the card out of its photo (transparent background, about 760px
    tall) and save it under that name."""
    order = [products[s] for s in FEATURED if s in products] + live
    picks = []
    for p in order:
        if in_stock(p) and p not in picks and os.path.exists(
                os.path.join(REPO, "images", "hero", p["slug"] + ".webp")):
            picks.append(p)
        if len(picks) == 3:
            break
    if len(picks) < 3:
        return "          <!-- fewer than three in-stock pieces have a cut-out in images/hero/ -->", []
    out = []
    # centre card first in the list, but painted last so it sits on top
    for pos, p in (("l", picks[1]), ("r", picks[2]), ("c", picks[0])):
        src = f"/images/hero/{p['slug']}.webp"
        dims = ""
        try:
            from PIL import Image
            w, h = Image.open(os.path.join(REPO, src.lstrip("/"))).size
            dims = f' width="{w}" height="{h}"'
        except Exception:
            pass
        name = html.escape(plain(p["title"]), quote=True)
        prio = ' fetchpriority="high"' if pos == "c" else ""
        out.append(f'''          <a class="hero-card hero-card--{pos}" href="/products/{p["slug"]}" aria-label="{name}">
            <span class="hero-card__float" style="--mask:url({src})">
              <img src="{src}" alt="{name}"{dims} loading="eager"{prio}>
            </span>
          </a>''')
    return "\n".join(out), picks


def shorts_block():
    """Homepage "From the table" row (site_content.py SHORTS)."""
    sc = bpp._content()
    figs = "\n".join(bpp.short_figure(v, t) for v, t in sc.SHORTS)
    return f'''  <!-- GENERATED by build-site.py from SHORTS in site_content.py. -->
  <section class="shorts-section section-reveal" id="videos" aria-labelledby="shortsTitle">
    <div class="container">
      <div class="section-header">
        <span class="section-label">VIDEOS</span>
        <h2 class="section-title title-underline" id="shortsTitle">From the <span class="gradient-text">table</span></h2>
        <p class="section-desc">What actually happens at the table. Deals, pulls and the odd tyre kicker.</p>
      </div>
      <div class="shorts-row shorts-row--scroll">
{figs}
      </div>
      <p class="shorts-more">More on <a href="{sc.YOUTUBE}" target="_blank" rel="noopener">YouTube</a> / <a href="{sc.TIKTOK}" target="_blank" rel="noopener">TikTok</a> / <a href="{sc.INSTAGRAM}" target="_blank" rel="noopener">Instagram</a></p>
    </div>
  </section>'''


VIDEOS_PAGE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- GENERATED by build-site.py from SHORTS / PRODUCT_SHORTS in site_content.py.
       Do not edit: change site_content.py, then re-run. -->
  <title>Videos from the Table | High End Fire</title>
  <meta name="description" content="Shorts from the High End Fire table at Adelaide card shows: deals, big pulls and the cards we sell. Buy the cards you see in them.">
  <link rel="canonical" href="{site}/videos">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#e05c2a">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="High End Fire Collectables">
  <meta property="og:title" content="Videos from the Table | High End Fire">
  <meta property="og:url" content="{site}/videos">
  <meta property="og:image" content="{site}/images/jonathon-vendor-table.jpg">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png">
  <link rel="manifest" href="/manifest.json">

  <script type="application/ld+json">
  {ld}
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/js/source-tracking.js"></script>
</head>
<body class="page-videos">
  {header}

  <main>
  <section class="shorts-section videos-page">
    <div class="container">
      <div class="section-header">
        <span class="section-label">VIDEOS</span>
        <h1 class="section-title title-underline revealed">From the <span class="gradient-text">table</span></h1>
        <p class="section-desc">Shorts from our table at the shows. Where a card in the video is for sale, the link under it takes you straight there.</p>
      </div>
      <div class="shorts-row">
{figs}
      </div>
      <p class="shorts-more">More on <a href="{youtube}" target="_blank" rel="noopener">YouTube</a> / <a href="{tiktok}" target="_blank" rel="noopener">TikTok</a> / <a href="{instagram}" target="_blank" rel="noopener">Instagram</a>. Rather watch live? <a href="{whatnot}" target="_blank" rel="noopener">Catch us on Whatnot</a>.</p>
    </div>
  </section>

{firstdibs}
  </main>

  {footer}

  <script src="/js/cart.js"></script>
  <script src="/js/main.js"></script>
  <script src="/js/watchlist.js" defer></script>
</body>
</html>
"""


def videos_page(products, header, footer):
    sc = bpp._content()
    # each Short links to the first in-stock card it features
    buy = {}
    for slug, ids in sc.PRODUCT_SHORTS.items():
        if slug in products and in_stock(products[slug]):
            for v in ids:
                buy.setdefault(v, slug)
    allv = sc.SHORTS + [s for s in sc.SHORTS_EXTRA if s[0] not in dict(sc.SHORTS)]
    figs = "\n".join(bpp.short_figure(v, t, buy.get(v)) for v, t in allv)
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "Videos from the table",
          "url": SITE + "/videos",
          "itemListElement": [{"@type": "ListItem", "position": i + 1,
                               "url": f"https://www.youtube.com/shorts/{v}", "name": t}
                              for i, (v, t) in enumerate(allv)]}
    return VIDEOS_PAGE.format(
        site=SITE, header=header, footer=footer, figs=figs,
        ld=json.dumps(ld, indent=2, ensure_ascii=False).replace("\n", "\n  "),
        youtube=sc.YOUTUBE, tiktok=sc.TIKTOK, instagram=sc.INSTAGRAM, whatnot=sc.WHATNOT,
        firstdibs=bpp.firstdibs_block("firstdibs-videos")).replace(
            'href="/videos" class="nav__link"', 'href="/videos" class="nav__link" aria-current="page"')


def legacy_links(products):
    """The homepage used to hold every product as /#slug and every section as
    /#pokemon. Send those old links to the page that now holds the thing."""
    return ('''  <!-- GENERATED by build-site.py. Old /#section and /#product links. -->
  <script>
  (function () {
    var sections = %s;
    var products = %s;
    function go() {
      var h = location.hash.slice(1);
      if (!h || document.getElementById(h)) return;
      if (sections[h]) location.replace(sections[h]);
      else if (products.indexOf(h) > -1) location.replace('/products/' + h);
    }
    go();
    window.addEventListener('hashchange', go);
  })();
  </script>''' % (json.dumps(LEGACY_ANCHORS), json.dumps(sorted(products))))


# ---------------------------------------------------------------------------
# other pages
# ---------------------------------------------------------------------------

def sync_nav(header):
    """Give the hand-written pages the same menu links as the master header,
    and repoint any stale homepage-section links in them."""
    links = re.search(r'<nav class="nav"[^>]*>(.*?)</nav>', header, re.S).group(1)
    changed = []
    for rel in NAV_SYNC:
        path = os.path.join(REPO, rel)
        if not os.path.exists(path):
            continue
        s = read(rel)
        m = re.search(r'(<nav class="nav"[^>]*>)(.*?)(</nav>)', s, re.S)
        new = s
        if m:
            mine = links
            page = "/" + rel[:-5] if not rel.endswith("index.html") else "/" + rel[:-11]
            mine = mine.replace(f'href="{page}" class="nav__link"',
                                f'href="{page}" class="nav__link" aria-current="page"')
            new = s[:m.start(2)] + mine + s[m.end(2):]
        for anchor, dest in LEGACY_ANCHORS.items():
            if anchor == "reviews":
                continue
            new = new.replace(f'href="/#{anchor}"', f'href="{dest}"')
        if new != s:
            write(rel, new)
            changed.append(rel)
    return changed


def sync_chrome(header, footer):
    """Contact bar, First dibs signup and footer on the hand-written pages.
    Each goes in a BUILD region, added the first time this runs."""
    topbar = re.search(r'<!-- BUILD:topbar -->\n(.*?)[ \t]*<!-- /BUILD:topbar -->', header, re.S).group(1)
    changed = []
    for rel, tag in CHROME_SYNC.items():
        if not os.path.exists(os.path.join(REPO, rel)):
            continue
        s = new = read(rel)
        # contact bar: first thing inside the page's own header
        if "<!-- BUILD:topbar -->" not in new:
            new = re.sub(r'(<header class="header">\n)',
                         r'\1    <!-- BUILD:topbar -->\n    <!-- /BUILD:topbar -->\n', new, count=1)
        new = region(new, "topbar", topbar, rel)
        # footer: the master copy, replacing whatever the page had
        if "<!-- BUILD:footer -->" not in new:
            m = re.search(r'[ \t]*<footer\b.*?</footer>\n?', new, re.S)
            mark = "  <!-- BUILD:footer -->\n  <!-- /BUILD:footer -->\n"
            if m:
                new = new[:m.start()] + mark + new[m.end():]
            else:
                i = new.index("</main>") + len("</main>\n") if "</main>" in new else new.index("</body>")
                new = new[:i] + "\n" + mark + new[i:]
        new = region(new, "footer", "  " + footer, rel)
        # First dibs: just above the footer
        if "<!-- BUILD:firstdibs -->" not in new:
            new = new.replace("  <!-- BUILD:footer -->",
                              "  <!-- BUILD:firstdibs -->\n  <!-- /BUILD:firstdibs -->\n\n  <!-- BUILD:footer -->", 1)
        new = region(new, "firstdibs", bpp.firstdibs_block("firstdibs-" + tag), rel)
        # the scripts the signup and the menu need
        for js in ("main.js", "watchlist.js"):
            if not re.search(r'src="/?js/%s"' % js, new):
                new = new.replace("</body>", f'  <script src="/js/{js}" defer></script>\n</body>', 1)
        if new != s:
            write(rel, new)
            changed.append(rel)
    return changed


def sync_sitemap(cats):
    s = read("sitemap.xml")
    today = datetime.date.today().isoformat()
    rows = "".join(
        f"  <url>\n    <loc>{SITE}/{slug}</loc>\n    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>daily</changefreq>\n    <priority>{prio}</priority>\n  </url>\n"
        for slug, prio in [("shop", "0.9")] + [(c["slug"], "0.8") for c in cats]
        + [("sold", "0.4"), ("videos", "0.5")])
    block = "  <!-- BUILD:categories -->\n" + rows + "  <!-- /BUILD:categories -->\n"
    if "<!-- BUILD:categories -->" in s:
        old = re.search(r'  <!-- BUILD:categories -->\n(.*?)  <!-- /BUILD:categories -->\n', s, re.S)
        # keep the old lastmod when nothing but the date would change
        strip = lambda t: re.sub(r"<lastmod>[^<]*</lastmod>", "", t)
        if strip(old.group(1)) == strip(rows):
            return False
        s = s[:old.start()] + block + s[old.end():]
    else:
        i = s.index("  <url>", s.index("</url>"))      # straight after the homepage row
        s = s[:i] + block + s[i:]
    write("sitemap.xml", s)
    return True


# ---------------------------------------------------------------------------

def build():
    src = bpp.load_catalogue()
    products = bpp.parse_products(src)
    if len(products) < 10:
        sys.exit("!! Found fewer than 10 products in shop.html. The card markup "
                 "has probably changed shape. Nothing written.")
    header, footer = bpp.load_chrome()

    live = [p for p in products.values() if in_stock(p)]
    sold = [p for p in products.values() if not in_stock(p)]
    members = {c["slug"]: [p for p in live if c["match"](p)] for c in CATEGORIES}
    counts = {slug: len(items) for slug, items in members.items()}
    counts.update(shop=len(live), sold=len(sold))
    cats = [c for c in CATEGORIES if members[c["slug"]]]

    untagged = [p["slug"] for p in products.values() if 'data-tags="' not in p["block"]]
    if untagged:
        print("  ! no data-tags attribute (add one, even if empty): " + ", ".join(untagged))

    # shop.html — the catalogue page itself
    shop = src
    shop = region(shop, "header", "  " + header, "shop.html")
    shop = region(shop, "footer", "  " + footer, "shop.html")
    shop = region(shop, "filterbar", filterbar("shop", counts), "shop.html")
    shop = region(shop, "ld", list_ld("Shop", "/shop", [("Home", "/"), ("Shop", "/shop")], live), "shop.html")
    shop = region(shop, "firstdibs", bpp.firstdibs_block("firstdibs-shop"), "shop.html")
    write("shop.html", shop)

    # category pages + sold archive
    for c in cats:
        write(c["slug"] + ".html", category_page(c, members[c["slug"]], counts, header, footer))
        print(f"  ✓ /{c['slug']:26s} {len(members[c['slug']])} in stock")
    for c in CATEGORIES:
        if c not in cats and os.path.exists(os.path.join(REPO, c["slug"] + ".html")):
            print(f"  ! /{c['slug']} is now empty; its page was left as it was. Delete or restock.")
    write("sold.html", category_page(SOLD, sold, counts, header, footer))
    print(f"  ✓ /{'sold':26s} {len(sold)} sold")

    # homepage
    idx = read("index.html")
    feat, picks = featured_block(products, live)
    idx = region(idx, "featured", feat, "index.html")
    idx = region(idx, "categories", category_tiles(members, live), "index.html")
    idx = region(idx, "legacy-links", legacy_links(products), "index.html")
    fan, fan_picks = hero_cards(products, live)
    idx = region(idx, "hero-cards", fan, "index.html")
    idx = region(idx, "shorts", shorts_block(), "index.html")
    write("index.html", idx)
    print(f"  ✓ homepage: {len(picks)} featured, {len(cats)} category tiles, "
          f"hero fan: {', '.join(p['slug'] for p in fan_picks) or 'none'}")

    write("videos.html", videos_page(products, header, footer))
    print("  ✓ /videos")

    changed = sync_nav(header)
    if changed:
        print("  ✓ menu updated on: " + ", ".join(changed))
    changed = sync_chrome(header, footer)
    if changed:
        print("  ✓ contact bar, First dibs and footer updated on: " + ", ".join(changed))
    if sync_sitemap(cats):
        print("  ✓ sitemap.xml: shop + category URLs")

    print()
    bpp.build()
    print(f"\nDone. {len(live)} in stock, {len(sold)} sold, {len(products)} product pages.")


if __name__ == "__main__":
    build()

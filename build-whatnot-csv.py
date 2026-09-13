#!/usr/bin/env python3
"""Generate a Whatnot bulk-import CSV for High End Fire's sealed product.

Reads index.html as the single source of truth for price, stock and image
naming, exactly like build-product-pages.py and build-merchant-feed.py, so a
Whatnot listing can never drift from the shopfront.

Output: whatnot-sealed-import.csv (gitignored / vercelignored — it carries
pricing intent that has no business being public).

Field values MUST match the Whatnot CSV template's approved values exactly:
docs.google.com/spreadsheets/d/1UNxbyQoXjpjuqYcCE_Ie94OTCEB7lXR7Yz84aynILW4
  Type            -> one of "Auction", "Buy it Now", "Giveaway"
  Condition       -> sealed product is "New"
  Category/Sub    -> "Trading Card Games" / "Pokemon Cards"
  Shipping Profile-> one of the weight bands in the Values tab, column B
"""
import csv
import html
import math
import os
import re
from decimal import Decimal

REPO = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(REPO, "whatnot-sealed-import.csv")
IMAGE_BASE = "https://highendfire.com.au/images/products"

# Whatnot takes commission, so list above the site price and turn Accept Offers
# on — buyers negotiate back toward the site price rather than away from a sale.
MARKUP = 1.10
ROUND_TO = 5

# Shipping bands are ESTIMATES from product type until Jonathon weighs one of
# each packed for post. Under-declaring comes straight out of his margin.
SHIP_BOX_EN = "1 KGs to <2 KGs"        # 36-pack English display, packed
SHIP_BOX_JP = "750 grams to <1 KGs"    # 30-pack Japanese box, packed
SHIP_BOX_JP_HC = "500 to <750 grams"   # Japanese high-class box (fewer packs)
SHIP_ETB = "1 KGs to <2 KGs"
SHIP_BUNDLE = "250 to <500 grams"      # 6 loose packs in a sleeve
SHIP_DECK_SET = "750 grams to <1 KGs"  # three starter decks together
SHIP_DECK_BOX = "500 to <750 grams"

# id -> (search title, shipping profile). Order is the CSV row order.
# Titles front-load what Whatnot buyers actually type: set name, set code,
# "Japanese", "Booster Box", "Sealed", then the chase card.
LISTINGS = [
    ("ascended-heroes-booster-bundle",
     "Pokemon Mega Evolution Ascended Heroes Booster Bundle Sealed 6 Packs",
     SHIP_BUNDLE),
    ("lost-abyss-s11-booster-box-jp",
     "Pokemon Lost Abyss s11 Japanese Booster Box Sealed Giratina VSTAR",
     SHIP_BOX_JP),
    ("25th-anniversary-collection-s8a-booster-box-jp",
     "Pokemon 25th Anniversary Collection s8a Japanese Booster Box Sealed",
     SHIP_BOX_JP),
    ("paradigm-trigger-s12-booster-box-jp",
     "Pokemon Paradigm Trigger s12 Japanese Booster Box Sealed Lugia VSTAR",
     SHIP_BOX_JP),
    ("terastal-festival-ex-sv8a-booster-box-jp",
     "Pokemon Terastal Festival ex sv8a Japanese High Class Booster Box Sealed",
     SHIP_BOX_JP_HC),
    ("storm-emeralda-m6-booster-box-jp",
     "Pokemon Storm Emeralda M6 Japanese Booster Box Sealed Mega Rayquaza ex",
     SHIP_BOX_JP),
    ("triple-beat-sv1a-booster-box-jp",
     "Pokemon Triple Beat sv1a Japanese Booster Box Sealed Scarlet Violet",
     SHIP_BOX_JP),
    ("mega-dream-ex-m2a-booster-box-jp",
     "Pokemon Mega Dream ex M2a Japanese High Class Booster Box Sealed",
     SHIP_BOX_JP_HC),
    ("abyss-eye-m5-booster-box-jp",
     "Pokemon Abyss Eye M5 Japanese Booster Box Sealed Mega Darkrai ex",
     SHIP_BOX_JP),
    ("mega-starter-set-bundle-jp",
     "Pokemon Mega Starter Set Japanese Eevee Meowscarada Zoroark ex Sealed",
     SHIP_DECK_SET),
    ("stellar-miracle-sv7-deck-build-box-jp",
     "Pokemon Stellar Miracle sv7 Japanese Deck Build Box Sealed",
     SHIP_DECK_BOX),
]

# Deliberately NOT listed:
#   sv10-destined-rivals-booster-box - a 6-box CASE is already live at A$5,700;
#       single boxes at A$880 would undercut it (Jonathon's call, 2026-09-13).
#   chaos-rising-booster-bundle      - already live on Whatnot at A$80.
#   pitch-black-booster-box / -etb / -booster-bundle - seeded 2026-08-18 and
#       still ACTIVE in Seller Hub (verified 2026-09-13: A$365 x1, A$150 x1,
#       A$85 x4). They do not render on the public profile grid, which only
#       lazy-loads 20 of 23 - do not take that as proof they sold.
#   one-piece-romance-dawn           - over the $1,000 enquiry-only threshold.

FOOTER = (
    "Ships from Adelaide, South Australia with tracking. Sold by High End Fire "
    "Collectables, a 5.0-rated Whatnot seller. Offers welcome."
)


def whatnot_price(site_price):
    """Site price + markup, rounded UP to the nearest $5."""
    # Decimal, not float: 450 * 1.10 in binary floating point is 495.00000000000006,
    # which rounds UP a whole band to $500 and quietly overprices the shelf.
    marked = Decimal(str(site_price)) * Decimal(str(MARKUP))
    return int(math.ceil(marked / ROUND_TO) * ROUND_TO)


def read_products():
    with open(os.path.join(REPO, "index.html"), encoding="utf-8") as f:
        doc = f.read()
    products = {}
    for match in re.finditer(r'<div id="([a-z0-9-]+)"[^>]*data-product-id="\1"', doc):
        pid = match.group(1)
        chunk = doc[match.start():match.start() + 4000]

        def attr(name):
            m = re.search(r'%s="([^"]*)"' % name, chunk)
            return m.group(1) if m else ""

        desc = re.search(r'class="product-card__desc"[^>]*>(.*?)</p>', chunk, re.S)
        products[pid] = {
            "price": attr("data-product-price"),
            "stock": attr("data-stock"),
            "desc": html.unescape(re.sub(r"<[^>]+>", "", desc.group(1)).strip()) if desc else "",
        }
    return products


def images_for(pid):
    """Every -N.jpg on disk, in order. Whatnot fetches and rehosts these."""
    names = sorted(
        f for f in os.listdir(os.path.join(REPO, "images", "products"))
        if re.match(r"^%s-\d+\.jpg$" % re.escape(pid), f)
    )
    return ["%s/%s" % (IMAGE_BASE, n) for n in names][:8]


def build():
    products = read_products()
    header = [
        "Category", "Sub Category", "Title", "Description", "Quantity", "Type",
        "Price", "Shipping Profile", "Offerable", "Hazmat", "Condition",
        "Cost Per Item", "SKU",
    ] + ["Image URL %d" % i for i in range(1, 9)]

    rows = []
    for pid, title, shipping in LISTINGS:
        if pid not in products:
            raise SystemExit("%s is not in index.html - did the id change?" % pid)
        p = products[pid]
        if not p["price"]:
            raise SystemExit("%s has no data-product-price" % pid)
        if len(title) > 80:
            raise SystemExit("%s title is %d chars, Whatnot caps at 80" % (pid, len(title)))

        imgs = images_for(pid)
        if not imgs:
            raise SystemExit("%s has no images - a listing without a photo will not sell" % pid)

        row = [
            "Trading Card Games",
            "Pokémon Cards",
            title,
            "%s\n\n%s" % (p["desc"], FOOTER),
            p["stock"] or "1",
            "Buy it Now",
            whatnot_price(p["price"]),
            shipping,
            "True",          # Accept Offers on, so buyers negotiate toward site price
            "Not Hazmat",
            "New",           # every line here is factory sealed
            "",              # Cost Per Item - Jonathon's figures, left blank
            pid,             # SKU mirrors the site id so stock reconciles
        ] + imgs + [""] * (8 - len(imgs))
        rows.append(row)

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print("Wrote %s - %d listings" % (os.path.relpath(OUT, REPO), len(rows)))
    total = 0
    for (pid, title, ship), row in zip(LISTINGS, rows):
        qty, price = int(row[4]), row[6]
        total += qty * price
        print("  A$%-5s x%-2s  %-22s  %s" % (price, qty, ship, title[:52]))
    print("Shelf value listed: A$%s" % format(total, ","))


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Put products on sale, or take them off, by rewriting index.html.

index.html is the single source of truth for price. api/_catalog.js parses
`data-product-price` out of it and prices the Stripe checkout from that, so a
sale is only real if that attribute changes. Anything that shows a discount
without changing it would advertise a price the checkout doesn't honour.

So a sale rewrites three things per card:
  1. data-product-price  -> the sale price (what the customer is charged)
  2. data-product-rrp    -> the regular price (kept so the sale can be undone)
  3. the visible price   -> struck-through regular, then the sale price
and the Product JSON-LD offer on the homepage, which must agree with both.

Removing an item from products-sale.json restores it: the regular price comes
back out of data-product-rrp and the attribute is dropped.

Run from the repo root:  python3 apply-sales.py [--dry-run]
Then rebuild:            python3 build-product-pages.py && python3 build-merchant-feed.py
"""
import json, os, re, sys
from datetime import date, datetime, timedelta

REPO = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(REPO, "index.html")
SALES = os.path.join(REPO, "products-sale.json")

# Google suppresses the strikethrough unless the regular price was the real
# selling price for 30 of the previous 200 days.
MIN_ESTABLISHED_DAYS = 30
# Not a Google limit — a sanity check on us. A "sale" that never ends is a
# permanent price dressed up as a discount, which is the ACCC's core test.
MAX_SALE_DAYS = 90


def load_sales():
    if not os.path.exists(SALES):
        return {}
    raw = json.load(open(SALES, encoding="utf-8"))
    return {k: v for k, v in raw.items()
            if not k.startswith("_") and isinstance(v, dict)}


def parse_date(v, field, slug):
    try:
        return datetime.strptime(str(v), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValueError(f"{slug}: {field} must be YYYY-MM-DD, got {v!r}")


def card_block(s, slug):
    m = re.search(r'<div id="%s"[^>]*class="product-card[^"]*"[^>]*>' % re.escape(slug), s)
    if not m:
        return None, None
    # the card runs to its closing div at the grid's indent level
    b = re.search(r'( *<div id="%s".*?\n        </div>\n)' % re.escape(slug), s, re.S)
    return (b.group(1), b.span()) if b else (None, None)


def attr(tag, name):
    m = re.search(r'%s="([^"]*)"' % re.escape(name), tag)
    return m.group(1) if m else None


def validate(slug, cfg, current_price, current_rrp, today):
    """Return the validated (sale, regular, starts, ends) or raise ValueError."""
    for f in ("sale_price", "regular_price", "regular_price_since", "starts", "ends"):
        if f not in cfg:
            raise ValueError(f"{slug}: missing required field '{f}'")

    sale = int(cfg["sale_price"])
    regular = int(cfg["regular_price"])
    since = parse_date(cfg["regular_price_since"], "regular_price_since", slug)
    starts = parse_date(cfg["starts"], "starts", slug)
    ends = parse_date(cfg["ends"], "ends", slug)

    if sale <= 0 or regular <= 0:
        raise ValueError(f"{slug}: prices must be positive")
    if sale >= regular:
        raise ValueError(
            f"{slug}: sale_price ({sale}) must be below regular_price ({regular})")

    # The declared regular price has to match what the item is really listed at,
    # otherwise we'd be inventing a higher 'was' price to manufacture a discount.
    listed = current_rrp or current_price
    if listed != regular:
        raise ValueError(
            f"{slug}: regular_price is {regular} but the site lists {listed}. "
            f"Fix the price on the site first, or correct regular_price — do not "
            f"raise it to create a bigger discount.")

    if ends <= starts:
        raise ValueError(f"{slug}: ends ({ends}) must be after starts ({starts})")
    if (ends - starts).days > MAX_SALE_DAYS:
        raise ValueError(
            f"{slug}: sale runs {(ends - starts).days} days. Over {MAX_SALE_DAYS} "
            f"stops being a sale and becomes the normal price — that is the "
            f"misleading-pricing test the ACCC applies.")
    if ends < today:
        raise ValueError(f"{slug}: sale already ended on {ends}; remove the entry")

    established = (starts - since).days
    if established < MIN_ESTABLISHED_DAYS:
        raise ValueError(
            f"{slug}: regular price only held for {established} days before the "
            f"sale starts. Google needs {MIN_ESTABLISHED_DAYS}+ or it suppresses "
            f"the strikethrough, and a 'was' price that was never really charged "
            f"breaches the ACL.")
    return sale, regular, starts, ends


def price_span(regular, sale):
    """Visible price: struck-through regular, then what they actually pay."""
    return (f'<span class="product-card__price-was">${regular:,}</span> '
            f'${sale:,}<small>.00 AUD</small>')


def rewrite_card(block, *, sale=None, regular=None):
    """Apply or clear a sale on one card's markup."""
    tag_m = re.search(r'<div id="[^"]*"[^>]*>', block)
    tag = tag_m.group(0)
    new_tag = tag

    if sale is None:
        # clearing: restore the regular price and drop the rrp attribute
        rrp = attr(tag, "data-product-rrp")
        if not rrp:
            return block, False
        new_tag = re.sub(r'\s*data-product-rrp="[^"]*"', '', new_tag)
        new_tag = re.sub(r'data-product-price="[^"]*"',
                         f'data-product-price="{rrp}"', new_tag)
        shown = f'${int(rrp):,}<small>.00 AUD</small>'
    else:
        new_tag = re.sub(r'data-product-price="[^"]*"',
                         f'data-product-price="{sale}"', new_tag)
        if attr(tag, "data-product-rrp"):
            new_tag = re.sub(r'data-product-rrp="[^"]*"',
                             f'data-product-rrp="{regular}"', new_tag)
        else:
            new_tag = new_tag[:-1].rstrip() + f' data-product-rrp="{regular}">'
        shown = price_span(regular, sale)

    out = block.replace(tag, new_tag, 1)
    out = replace_price_span(out, shown)
    return out, out != block


def replace_price_span(block, inner):
    """Swap the contents of the price span, counting nested spans.

    While an item is on sale the span contains another span for the struck-out
    price, so a non-greedy `.*?</span>` stops at the inner closing tag and
    leaves the old figure stranded after it.
    """
    m = re.search(r'<span class="product-card__price[^"]*">', block)
    if not m:
        return block
    start, depth, end = m.end(), 1, None
    for t in re.finditer(r'</?span\b', block[start:]):
        depth += -1 if t.group(0).startswith("</") else 1
        if depth == 0:
            end = start + t.start()
            break
    if end is None:
        return block
    return block[:start] + inner + block[end:]


def sync_homepage_jsonld(s, slug, price):
    """The homepage carries its own Product JSON-LD; its price must match."""
    def fix(m):
        blob = m.group(0)
        if f'"@id": "https://highendfire.com.au/products/{slug}"' not in blob \
           and f'/products/{slug}"' not in blob:
            return blob
        return re.sub(r'("price":\s*")[^"]*(")', rf'\g<1>{price}\g<2>', blob)
    return re.sub(r'\{[^{}]*"@type":\s*"Offer".*?\}', fix, s, flags=re.S)


def main():
    dry = "--dry-run" in sys.argv
    today = date.today()
    sales = load_sales()
    s = open(INDEX, encoding="utf-8").read()
    original = s

    # every card currently marked as on sale, so we can clear ones that ended
    on_sale_now = set(re.findall(r'<div id="([^"]+)"[^>]*data-product-rrp="', s))
    errors, applied, cleared = [], [], []

    for slug, cfg in sales.items():
        block, _ = card_block(s, slug)
        if block is None:
            errors.append(f"{slug}: no product card with that id in index.html")
            continue
        tag = re.search(r'<div id="[^"]*"[^>]*>', block).group(0)
        cur_price = int(attr(tag, "data-product-price") or 0)
        cur_rrp = int(attr(tag, "data-product-rrp") or 0)
        try:
            sale, regular, starts, ends = validate(
                slug, cfg, cur_price, cur_rrp, today)
        except ValueError as e:
            errors.append(str(e))
            continue
        if starts > today:
            print(f"  · {slug}: scheduled, starts {starts} (not applied yet)")
            continue
        new_block, changed = rewrite_card(block, sale=sale, regular=regular)
        if changed:
            s = s.replace(block, new_block, 1)
            s = sync_homepage_jsonld(s, slug, sale)
            applied.append(f"{slug}: ${regular} -> ${sale} until {ends}")

    for slug in on_sale_now - set(sales):
        block, _ = card_block(s, slug)
        if block is None:
            continue
        new_block, changed = rewrite_card(block, sale=None)
        if changed:
            tag = re.search(r'<div id="[^"]*"[^>]*>', new_block).group(0)
            s = s.replace(block, new_block, 1)
            s = sync_homepage_jsonld(s, slug, attr(tag, "data-product-price"))
            cleared.append(slug)

    if errors:
        print("\nREFUSED — nothing written:\n", file=sys.stderr)
        for e in errors:
            print(f"  ✗ {e}\n", file=sys.stderr)
        return 1

    for a in applied:
        print(f"  ✓ on sale   {a}")
    for c in cleared:
        print(f"  ✓ off sale  {c} (regular price restored)")
    if not applied and not cleared:
        live = len([k for k in sales if card_block(s, k)[0] is not None])
        print(f"  no changes — {live} sale(s) already applied and up to date"
              if live else "  no changes — no active sales")

    if s != original and not dry:
        with open(INDEX, "w", encoding="utf-8") as f:
            f.write(s)
        print("\nindex.html updated. Now run:")
        print("  python3 build-product-pages.py && python3 build-merchant-feed.py")
    elif dry and s != original:
        print("\n(dry run — index.html not written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

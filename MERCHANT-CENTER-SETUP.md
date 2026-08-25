# Google Merchant Center — free listings setup

Everything on the website side is done and live. What's left is the account
work, which needs your Google login, so it has to be you.

**Free listings** means your products can show up in the Shopping tab and other
Google surfaces without paying for ads. It's free. You do not need to set up a
Google Ads campaign, and you should skip any prompt that tries to sell you one
until you've seen the free listings working.

**Your feed is live here:**

```
https://highendfire.com.au/feeds/products.xml
```

It currently holds **51 products** — everything in stock with a buyable price.
Prices and stock are read straight from the site, so they can't disagree with
the page Google lands on; a mismatch there is one of the top reasons products
get rejected.

**On GST:** Google Australia requires the price you submit to be the full
amount the customer pays, GST included. Yours already is — the feed reads the
same figure Stripe charges — so there is nothing to change. Just don't add a
"+ GST" anywhere later without telling me, because then the feed and the
checkout would disagree.

---

## 1. Create the account

1. Go to **merchants.google.com** and sign in with the Google account you want
   to own this — use the same one your Google Business Profile is on.
2. Choose **Australia** as the country and **AUD** as the currency. These are
   very hard to change later, so get them right.
3. Business name: **High End Fire Collectables**.
4. Tell it you sell on **your own website**.

## 2. Add and claim the website

1. In the left menu, go to **Business profile → Website**.
2. Enter `https://highendfire.com.au`.
3. It will ask you to verify you own it. **You've almost certainly already done
   this** — there's a Google verification file sitting on the site
   (`google385c4522a16672c0.html`), which means the domain is verified in Google
   Search Console. If you're signed in with that same Google account, it should
   verify instantly. If it doesn't, pick the **HTML file upload** option and tell
   me the filename it gives you — I'll add it and redeploy in a minute.

## 3. Fill in the business details

Merchant Center will not approve you with these blank.

1. **Business information → About your business** — business name, country,
   and your contact email (`jonathon@highendfire.com.au`).
2. **Shipping and returns → Shipping** — add a service for Australia:
   - Delivery area: all of Australia
   - Rate: flat **$10 AUD**
   - Delivery time: whatever you actually do (e.g. 2–7 business days)
3. **Shipping and returns → Return policy** — 30 days, return by mail,
   customer pays return postage. This must match what
   [your returns page](https://highendfire.com.au/refund) says. If the real
   policy is different, use the real one and tell me, and I'll correct the
   structured data on the product pages to agree with it.
4. **Business information → Checkout** — your checkout is on your own site
   through Stripe, so nothing special to configure.

## 4. Add the feed

1. Left menu → **Products → Feeds** (some accounts call this **Data sources**).
2. Click **Add product feed**.
3. Country: **Australia**. Language: **English**.
4. Choose **Scheduled fetch** — this is the one you want, because it means
   Google re-downloads the file itself and picks up price and stock changes
   without you doing anything.
5. Feed URL:
   ```
   https://highendfire.com.au/feeds/products.xml
   ```
6. Fetch frequency: **Daily**, some time in the early morning.
7. Save, then click **Fetch now** to pull it straight away.

## 5. Turn free listings on

1. Left menu → **Growth → Manage programs** (may be **Marketing → Free
   listings**).
2. Find **Free listings** and click **Get started** / **Enable**.
3. Accept the terms.

## 6. Wait, then check

Review usually takes **3–5 business days**, sometimes up to two weeks on a brand
new account. Then go to **Products → All products** and look at the status
column.

---

## What to expect, honestly

**The feed carries 51 of your 64 products.** The other 13 are held back on
purpose: 7 are sold out, and 6 are enquiry-only or above the $3,000 mark where
cart.js switches them to "enquiry" and they no longer have a buyable price.
Those all still have their own page — they're just not Shopping products.

**48 of the 51 will show a warning about missing identifiers.** That's expected
and deliberate. Google wants a barcode (GTIN) for branded products, but single
trading cards genuinely don't have one, so they're correctly declared as
`identifier_exists: no`. Only the sealed boxes could have a barcode; I found and
used the real Pokémon Center part numbers for the Ascended Heroes bundle, the
Pitch Black bundle and the Pitch Black booster box. For the rest I couldn't
source a verified number, so they're marked as having none rather than carrying
a guess — a wrong barcode gets your listing matched to somebody else's product,
which is far worse than a warning.

**To fix the sealed ones properly:** photograph the barcode on the back of each
box and send me the digits. Five-minute job, and it will measurably improve how
those perform. The single cards need nothing — the warning is the correct state.

## The one product I'd hold back

**The Destined Rivals booster box is likely to be rejected on image mismatch.**
Its listing photo is of the sealed *case*, and the description openly says so.
Google checks that the image matches the product, and a photo of six boxes on a
listing for one box is exactly what that check is for.

Two options: shoot a single box and I'll swap the image everywhere, or I remove
it from the feed until you have that photo. Say the word either way. Everything
else should sail through.

## When stock or prices change

The feed rebuilds from the site, so after any price or stock edit:

```bash
python3 build-product-pages.py && python3 build-merchant-feed.py
```

Then commit and push. Google re-fetches daily on its own.

## Adding new stock later

When you list a new card on the site, run the same two scripts and it picks it
up automatically — there's no separate list to maintain. Sold-out items drop
out of the feed but keep their page, which is what you want: the page still
ranks and still shows you move stock.

---

## Running a sale

The feed supports sale pricing — Google shows the old price struck through,
which is a real click-through lift. Nothing is on sale right now; the plumbing
is just ready.

**To put something on sale**, tell me the item and the price and I'll do it, or
edit `products-sale.json` yourself:

```json
{
  "gyarados-6-base-set": {
    "sale_price": 85,
    "regular_price": 100,
    "regular_price_since": "2026-05-01",
    "starts": "2026-09-01",
    "ends": "2026-09-15"
  }
}
```

then run:

```bash
python3 apply-sales.py && python3 build-product-pages.py && python3 build-merchant-feed.py
```

Deleting the entry and re-running takes the item back off sale and restores the
old price exactly.

### The rules, and why the script argues with you

`apply-sales.py` refuses to write rather than warning, because both of these
bite hard:

- **Google** only shows the strikethrough if the regular price genuinely held
  for 30 of the previous 200 days. Fake "was" prices get the annotation
  suppressed and, repeated, risk the account.
- **Australian Consumer Law** treats a "was" price that was never really
  charged as misleading conduct. The ACCC prosecutes this, and penalties are
  per breach.

So the script checks the sale price is actually lower, that the regular price
you declare matches what the site really lists (you can't inflate it to
manufacture a discount), that the regular price had held 30+ days, and that the
sale ends within 90 days. A sale that never ends isn't a sale.

**One thing to understand:** the discount is real. Putting an item on sale
changes what Stripe charges, because the checkout prices from the same figure.
There's no way to show a discount you don't honour, which is deliberate.

---

## How to check it's actually working

Once the account is live, these are the places to look:

| Question | Where to look |
|---|---|
| Did Google fetch my feed? | Merchant Center → **Products → Data sources** — shows last fetch time and any errors |
| Which products got rejected, and why | Merchant Center → **Products → Needs attention** |
| Are free listings actually on? | Merchant Center → **Growth → Manage programs** — Free listings should say Active |
| Am I getting free traffic? | Merchant Center → **Performance → Free listings** (clicks and impressions, separate from ads) |
| Is Google indexing the product pages? | Search Console → **Pages**, and **Enhancements → Merchant listings** |
| Does one page's data look right? | [Rich Results Test](https://search.google.com/test/rich-results) — paste any product URL |

**Expected timeline.** Feed fetch is minutes. Product review is 3–5 business
days, up to two weeks on a brand new account. Free listing impressions usually
start within a few days of approval.

**Don't spend money yet.** Free listings cost nothing and will tell you whether
these listings convert. Watch them for two weeks before considering Shopping
ads. If the free listings get impressions but no clicks, the problem is your
images or titles, and paying for traffic would just buy the same result.

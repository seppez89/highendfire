# Card show kit — free pack + Google reviews

Built 2026-08-06 for the show on the weekend of 8–9 Aug 2026.

## What's in here

| File | What it is |
|---|---|
| `print-kit.html` | Print this. Page 1 = A4 table sign. Page 2 = 8 handout cards. |
| `qr-review-print.png` | The QR on its own (300dpi-ish, for a proper printer or a sticker). |
| `qr-review.svg` / `qr-review-dark.svg` | Vector QR, dark-on-white and white-on-dark. |
| `build-print-kit.py` | Regenerates all of the above **and** the web copies. Edit `TARGET_URL` / `EVENT_LABEL` at the top and rerun. |
| `../table.html` | The **on-screen** version of the table sign, live at `highendfire.shop/table`. Prop a phone or tablet on the table and open it. Same QR, same target as the printed sign. |
| `../images/qr-review.svg` / `.png` | Web copies of the QR, written by the build script so the screen sign and the printed sign can never drift apart. |

To print: open `print-kit.html` in Chrome → Cmd+P → **Paper size A4**, **Margins: None**,
**tick "Background graphics"**. Without background graphics the QR prints blank.

Page 1 goes in a $4 photo frame on the table. Page 2 gets cut into 8 cards you hand
to people who don't want to scan right then.

**Screen version:** open `highendfire.shop/table` on a spare phone or tablet, brightness
all the way up, auto-lock off, propped facing the customer. It's the same QR pointing at
the same `/review` page. Use it *as well as* the printed sign, not instead of it — a
screen that has gone to sleep signs nothing, and the paper always works.

The QR is on a solid white plinth on both. Never put it on the dark background: a code
on anything other than white is the most common reason a scan fails at a table.

---

## The one rule that changes the plan

**You cannot give someone a free pack in exchange for a Google review.** Google's review
policy bans incentivised reviews outright — offering money, products, discounts or
anything of value for a review. The penalty isn't a warning; it's the reviews getting
stripped and, at worst, the whole profile suspended. A brand-new listing whose first
20 reviews all arrive within one afternoon from one location is exactly the pattern
their spam detection looks for.

(PokeNE does the $10-for-a-Google-review thing on video. It's against policy. He has
15 million in sales and a 65K-sub channel to absorb the risk; a listing with zero
reviews does not.)

So the kit splits it in two:

- **The free pack is for the email.** No platform on earth has rules about that. It's
  the strongest capture offer you can run and it's 100% clean.
- **The review is asked for separately, unincentivised**, and mostly *after* the show
  via the follow-up email. Spreading reviews over days looks natural, which is also
  what stops them getting filtered.

You lose nothing. Someone who's happy enough to hand over their email is the same
person who'll leave a review when you ask two days later.

---

## Before the show — set up the Google Business Profile

You have to do this bit yourself; it needs your Google login and a verification video.

**Heads up on eligibility:** Google does not allow profiles for online-only businesses.
You qualify as a **service-area business** because you genuinely meet customers in
person — card shows, local pickup, and buying collections face to face in Adelaide.
Set it up that way and it's legitimate. Do not invent a shopfront address.

1. Go to **google.com/business** and click **Manage now**. Sign in with the Google
   account you actually want to own this — not a throwaway.
2. Business name: **High End Fire Collectables**. Type it exactly as it appears on the
   site; the name has to match reality or verification fails.
3. When it asks *"Do you want to add a location customers can visit?"* → choose **No**.
4. It'll then ask where you serve customers. Enter **Adelaide SA** (add wider SA or
   "Australia" if you post nationally).
5. Category: **Collectibles Store**. Add **Trading Card Store** and **Hobby Store** as
   secondary categories.
6. Add the phone number and **https://highendfire.shop**.
7. Verification: it'll most likely ask for a **video**. Record one continuous take,
   1–2 minutes, no cuts, showing — in this order — your stock/inventory, something that
   proves the business is yours (invoices, packaging with your branding, the shipping
   setup), and then you handling it. Do it in daylight, don't narrate to camera, don't
   stop recording.
8. **Turnaround is 24 hours to 5 business days.** Starting today that *might* land
   before Saturday. Assume it won't.

That last point is why the printed QR points at **highendfire.shop/review** and not at
Google. The page decides where people go, so nothing needs reprinting when the link
arrives.

### When verification comes through

1. In your Business Profile, go to **Read reviews → Get more reviews** and copy the
   short link (it looks like `https://g.page/r/XXXXXXXXXXXX/review`).
2. Open `review.html` in the repo, find the line near the bottom:
   ```js
   var GOOGLE_REVIEW_URL = '';
   ```
   Paste the link between the quotes.
3. `git push origin main` — Vercel redeploys itself.

The page flips from "our listing is being verified" to a working **Leave a Google
Review** button. Same URL, same QR codes.

---

## On the day

The table sign does the work. When someone scans and shows you the screen, hand over
the pack — no conditions, no mention of reviews at that moment.

The review ask is a separate, later, verbal thing, and only to people you actually
looked after:

> "Hope you're happy with it, mate. If you get a sec later, a Google review really
> helps a small shop like mine get found — no stress either way."

Then let them go. Don't stand there while they type it. Reviews written under the
seller's gaze are short, generic, and read as fake.

**Bring:** the framed sign, the 8 cut cards, and 60–80 loose booster packs. At $6–7 a
pack that's ~$450 of stock to buy a few dozen emails — cheap next to what you'd pay
Meta for the same list.

---

## After the show

Send the follow-up **within 48 hours**, while they still remember your face. It should
do two things and nothing else: thank them, and ask for the review. Do not sell in it —
that's what the Watchlist is for.

Everything captured through this page is tagged `source: show-aug26` in the form data,
so the signups are easy to pull out later.

⚠️ **Known gap:** `review.html` posts to FormSubmit like the rest of the site, which
means every signup lands as an individual email in Gmail rather than in a list you can
actually send to. It works for the show, but you can't send that follow-up until the
list lives somewhere real (Brevo — you're already using it for the essetech migration).
Worth doing in the week after.

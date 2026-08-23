# Card show kit — free pack + Google reviews

Built 2026-08-06 for the show on the weekend of 8–9 Aug 2026.

## What's in here

| File | What it is |
|---|---|
| `print-kit.html` | Print this. Page 1 = A4 table sign. Page 2 = 8 handout cards. |
| `qr-review-print.png` | The QR on its own (300dpi-ish, for a proper printer or a sticker). |
| `qr-review.svg` / `qr-review-dark.svg` | Vector QR, dark-on-white and white-on-dark. |
| `build-print-kit.py` | Regenerates all of the above **and** the web copies. Edit `TARGET_URL` / `EVENT_LABEL` at the top and rerun. |
| `../table.html` | The **on-screen** version of the table sign, live at `highendfire.com.au/table`. Prop a phone or tablet on the table and open it. Same QR, same target as the printed sign. |
| `../review.html` | Where the QR lands. Phone-first: tap through to Google, come back, drop an email, show the finish screen. |
| `../images/qr-review.svg` / `.png` | Web copies of the QR, written by the build script so the screen sign and the printed sign can never drift apart. |

To print: open `print-kit.html` in Chrome → Cmd+P → **Paper size A4**, **Margins: None**,
**tick "Background graphics"**. Without background graphics the QR prints blank.

Page 1 goes in a $4 photo frame on the table. Page 2 gets cut into 8 cards you hand
to people who don't want to scan right then.

**Screen version:** open `highendfire.com.au/table` on a spare phone or tablet, brightness
all the way up, auto-lock off, propped facing the customer. It's the same QR pointing at
the same `/review` page. Use it *as well as* the printed sign, not instead of it — a
screen that has gone to sleep signs nothing, and the paper always works.

The QR is on a solid white plinth on both. Never put it on the dark background: a code
on anything other than white is the most common reason a scan fails at a table.

### `/review` runs on the customer's phone (changed 2026-08-23)

The whole thing now happens on the phone they scanned with — they never touch your iPad:

1. They point their camera at the QR on the sign → `/review` opens in their browser.
2. They tap **Write my Google review** → Google's review form opens on their phone.
3. They write it, come back to the tab — the page has already moved on to the email step.
4. They drop their email → the **SHOW THIS TO JON** screen comes up, stamped with the time.
5. They hold the phone up, you hand over the pack.

Because it's their device, the page remembers where they were for two hours. iOS drops
Safari tabs while the Google app is in front, and without that the customer comes back
to a page that has forgotten they ever left and asks them to review you again.

**The iPad is optional now.** If you still want one out, `/table` is the sign and
`/review` works on it as a kiosk — it shows a small hand-off code so someone can move
the flow onto their own phone, and a **"Start again (next person) →"** button to clear
it between customers. Settings: **auto-lock off, brightness up, Guided Access on**
(triple-click the side button) so nobody wanders off into Safari.

The old version asked the customer to scan a QR *displayed on the page*. That worked on
the iPad and was impossible on a phone — which is the device nearly everyone arrives on.

---

## The offer

**Buy a card — even a $1 one → scan the QR and leave a Google review → get a free
booster pack.** Three steps, decided by Jonathon on 2026-08-06 with the policy risk
below understood and accepted.

### Known risk, accepted

Google's review policy bans incentivised reviews — offering money, products, discounts
or anything of value in exchange for one. Tying the pack to the review is squarely
inside that. Realistic consequences, worst to least:

- The reviews get filtered or deleted, so the effort produces nothing.
- The profile gets suspended. Recovering a suspended listing is slow and sometimes
  doesn't work.
- A brand-new listing taking 20+ reviews in one afternoon from one location is the
  exact pattern their spam detection looks for, so the burst is the risky part more
  than the incentive itself.

(PokeNE runs the $10-for-a-Google-review version on video. Same policy issue — he has
15 million in sales and a 65K-sub channel to absorb it.)

**If you want to cut the risk without changing the offer:** don't push everyone to
review at the table. Ask a portion of buyers on the day and email the rest the review
link a couple of days later — same total reviews, spread over days instead of hours,
which is what stops a burst looking manufactured.

The compliant version, if you ever want to switch back: hand the pack over for the
purchase alone, and ask for the review separately without tying anything to it.

---

## The Google Business Profile — already live ✅

Verified as of 2026-08-06. Review link:

```
https://g.page/r/CbimcZkxK8FrEBM/review
```

Place ID `ChIJASdtuSfFByYRuKZxmTErwWs` — that's the stable identifier; the `g.page`
short link is only a redirect to `search.google.com/local/writereview`. The link is
already wired into `review.html`, so the review button on `/review` works today.

**Don't print the QR image Google gave you.** That download is 132×132px, has a
transparent background, and has **no quiet zone** — the blank margin the QR spec
requires. Without it most scanners can't find the code at all, and at table-sign size
it's about 45 DPI. `build-print-kit.py` regenerates the same link properly as
`qr-google-direct.png`. Any QR you make for print needs `border=4` and opaque colours.

Use the `/review` QR on the table anyway — one code captures the email *and* routes to
Google, and because it points at your own domain you can change the destination later
without reprinting a thing. `qr-google-direct.png` is there if you want a small
straight-to-Google card for people who've bought from you before.

---

## On the day

Buy a card → scan → leave a review → show you the screen → take the pack.

The purchase gate is doing real work. It filters out the people who only ever want free
stuff (PokeNE's whole objection to giveaways), and it means every address on the list
belongs to someone who has actually paid you money once. The trade-off is that you no
longer capture browsers, so the $2–10 bin matters more than ever — it's what converts a
looker into a buyer into a subscriber.

Two things to hold to on the day:

- **Don't read the review before handing the pack over.** Standing over someone while
  they write, or checking the star count first, turns a customer into a hostage and it
  shows in the writing. Take their word that it's done.
- **Don't script the review.** "Say we had great prices" produces near-identical
  reviews, which is the single most detectable pattern there is. Let people write badly
  and in their own words — that's what real ones look like.

The line at the table:

> "Grab anything off the table, even a dollar card, then scan that code and leave us a
> review — I'll throw you a free pack for it."

**Bring:** the framed sign, the 8 cut cards, and 60–80 loose booster packs. At $6–7 a
pack that's ~$450 of stock to buy a few dozen emails — cheap next to what you'd pay
Meta for the same list.

---

## After the show

Send the follow-up **within 48 hours**, while they still remember your face. It should
do two things and nothing else: thank them, and ask for the review. Do not sell in it —
that's what the Watchlist is for.

Everything captured through this page is tagged `source: show-aug26`, which routes it to
its own Brevo list if you set one up (see below), so show signups stay separable from
ordinary website signups.

---

## Email capture — WORKING ✅

Signups no longer go to FormSubmit. `/review` and both homepage watchlist forms post to
**`/api/subscribe`**, which adds the contact straight to a Brevo list — so the list is
something you can actually send to.

**Verified end to end on 2026-08-06.** A real signup through each form landed in the right
list: `homepage-inline` → **Watchlist (id 3)**, `show-aug26` → **Card Show Leads (id 4)**.
Both lists went 0 → 1 subscribers on the test. `/api/contact` is delivering again too, from
`noreply@essetech.com.au` with the enquirer as reply-to.

**Before the doors open, load <https://highendfire.com.au/api/subscribe> on your phone and
check it says `"ready": true`.** That's a live test — it asks Brevo whether the key works
and the lists exist — not just a check that the settings are filled in. Ten seconds, and it
is the difference between capturing a day's emails and finding out on Monday that you
didn't.

Two test contacts (`verify.show@` and `verify.home@highendfire.com.au`) are sitting in those
lists from the check. Delete them in Brevo before the first real send.

Anything with a `source` starting `show` goes to the show list; everything else goes to
the Watchlist.

### The setup, for when this has to be rebuilt

Four variables in **Vercel → highendfire → Settings → Environment Variables**, all set for
**Production**, then redeploy:

| Name | Value |
|---|---|
| `BREVO_API_KEY` | **API** key from Brevo → SMTP & API → **API Keys** tab |
| `BREVO_LIST_ID` | numeric id of the Watchlist list (currently `3`) |
| `BREVO_LIST_ID_SHOW` | numeric id of the Card Show list (currently `4`) |
| `RESEND_API_KEY` | key from resend.com — fixes the contact form and backs up signups |

`CONTACT_FROM_EMAIL` is set to `High End Fire <noreply@essetech.com.au>` because that
domain is verified in Resend and `highendfire.com.au` is not. These emails only ever go to
Jonathon, so the sender is invisible to customers.

### Three traps that cost an hour on 2026-08-06

1. **Brevo has two kinds of key on one page.** Only the **API key** (`xkeysib-`, ~89 chars)
   works. The **SMTP key** (`xsmtpsib-`) sits right next to it and fails with a 401 that
   reads like a bad key.
2. **Brevo's "authorised IPs" blocks serverless outright.** Brevo → **Security → Authorized
   IPs** must have blocking **Deactivated for API keys**. Vercel functions get a different
   AWS IP per request (two minutes apart we saw `44.202.32.96` then `44.198.169.171`), so
   whitelisting addresses never holds — the blocking has to be off. It returns 401 with an
   unrecognised-IP message, which looks exactly like a key problem and sends you chasing
   the wrong thing.
3. **Variables set ≠ variables working.** That's why `GET /api/subscribe` asks Brevo
   rather than checking the boxes are filled.

**The order things are tried:** Brevo first. If Brevo is unconfigured or fails, the
address is emailed to you via Resend. If that's unavailable too, it's written to the
Vercel log as `CAPTURED_SIGNUP` and the visitor is still told they're on the list —
because a customer who sees an error at your table is gone for good.

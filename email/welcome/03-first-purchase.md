# WELCOME 3 — the first-purchase email

**Delay:** +7 days after Welcome 0
**Goal:** the first transaction. Small, easy, low-risk — the point is to convert a reader
into a customer, not to maximise the order.

---

## Before you send — checklist

**Decide before writing:**
- [ ] **The offer is free tracked post on the first order, not a discount.** Discounting a
      $140 card trains the list to wait; covering postage removes the actual friction
      (a $12–15 line item on a $60 card feels absurd, and that's where carts die).
      Confirm you can absorb it — cheapest band only.
- [ ] Set an expiry that's real: 7 days. Put the actual date in, not "this week only".

**Segment swaps (one block changes, the email still goes to everyone):**
| Tag | Card to feature | CTA |
|---|---|---|
| `starter` / no tag | Machoke IR 151 — $60 | Buy link |
| `art` | Machoke IR 151 — $60 | Buy link |
| `graded` | Fossil Lapras 10/62 PSA 7 — $300 | Buy link |
| `sealed` | Mega Evolution Pitch Black Booster Bundle — $75 | Buy link |
| `tcg-other` | Raditz SB01-026 SR Alt Art — $75 | Buy link |
| `highend` | **No product.** Swap the whole block for the viewing offer below. | Reply |

- [ ] Confirm every featured card is in stock and priced correctly in `index.html`.
- [ ] `[[CARD PHOTO]]` — raking-light macro of the featured card.
- [ ] UTM: `?utm_source=welcome&utm_medium=email&utm_campaign=w3`

---

**Subject:** `The one I'd start you on`
**Preview text:** `Plus free tracked post on your first order, until [[DATE]].`

---

Most people's first card from a new shop is a test. Not of the card — of whether the
thing turns up, whether it's packed like someone cared, and whether the photos were honest.

So I'd rather your first one be small.

[[CARD PHOTO]]

**[[CARD NAME]] — $[[PRICE]]**

[[TWO SENTENCES on why this specific card. What's good about it as an object — the
texture, the composition, the era. Not what it might be worth.]]

**How it arrives:** penny sleeve, top loader, team bag, rigid mailer, tracked. Photographed
before it goes in the satchel, so we're both looking at the same card. That's every order,
not a first-order special.

**Free tracked post on your first order** — until [[DATE, 7 days out]]. No code needed
[[or: use code FIRSTLOOK at checkout]]. It's postage, not a discount: I'd rather knock out
the thing that makes a $60 card feel silly to buy than pretend the card's worth less than
it is.

**One thing**

→ **[Take this one]([[LINK]])**

**The footnote**

Not the right card? Reply with a budget and what you like, and I'll pick something from
the case and tell you why. If nothing in there fits, I'll say so — I'd rather you waited
for the right card than bought the wrong one from me in week one.

— Jonathon
High End Fire Collectables

---

## `highend` variant — swap the product block for this

**Subject:** `Want a proper look at one of the serious pieces?`

You said you're here for the serious end, so I won't try to sell you a card in an email.
That's not how a four-figure piece should be bought.

What I will do: pick any piece in the case and I'll send you a **raking-light video** of
it — a couple of minutes, lamp low and flat, every edge and surface, no music, no cuts —
plus the sold comps I'm pricing against and exactly what I'd want to know if I were buying it.

No obligation and no follow-up sequence. If it's not right, it's not right.

→ **Just reply with the card name.**

---

## Notes
- Free post rather than a discount is the single most important call in this email. It
  protects margin and price integrity while removing the real objection.
- The `highend` variant converts on a completely different mechanism — a conversation and
  a video. Your top four items are 73% of your capital, and none of them will ever sell
  from a buy button in an inbox. Don't ask them to.
- The final footnote ("I'd rather you waited") is the line that makes the first purchase
  feel safe. It's also true, which is why it works.

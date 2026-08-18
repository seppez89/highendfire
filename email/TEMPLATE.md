# RAKING LIGHT — weekly fill-in template

Copy this file, rename it `emails/week-NN-slug.md`, fill the six blocks, run the pre-send
check, send. Twenty minutes once it's a habit.

---

## The six blocks

**1. THE CARD OR THE IDEA** — what is this issue about?
> One line. If you can't write it in one line, you have two issues, not one.

**2. THE ANGLE** (40–70 words) — the hook.
> Start with the discovery, not the context. No greeting, no "this week". First sentence
> should be something the reader didn't know and can check.

**3. THE LOOK** (150–250 words) — the story or lesson.
> One idea. Broken into 2–4 short paragraphs with bold lead-ins so it skims on a phone.
> Somewhere in here, give the reader something they can do tonight with a card they
> already own.

**4. IN THE CASE** — the product connection.
> One card. Name, set/number, price in AUD, one honest sentence about why it belongs in
> *this* story. If nothing in stock genuinely fits: **say so and skip it.** An issue with
> no product beats a forced one.

**5. ONE THING** — the primary CTA.
> One link, one action, on its own line, with the arrow. Under $600 → buy link.
> Over $1,000 → "reply and I'll send you the raking-light video and the comps."

**6. THE FOOTNOTE** — the soft CTA.
> Reply / want list / send me a photo. Never a second buy link. Rotate between:
> - "Reply and tell me what you're hunting."
> - "Send me a photo of it and I'll tell you what I see."
> - "Reply with your budget and I'll pick one."
> - "What should I cover next?"

---

## The skeleton (copy from here down)

```
Subject:      [under 45 characters, curiosity or specific detail — never both]
Preview text: [a different angle to the subject, not a repeat of it]

> RAKING LIGHT — [[Thursday D Month YYYY]]

[THE ANGLE — 40–70 words. The discovery. No warm-up.]

[[PHOTO — raking light, dark background, phone macro]]

**[Bold lead-in]**

[THE LOOK — paragraph 1]

**[Bold lead-in]**

[THE LOOK — paragraph 2]

[THE LOOK — the thing they can try tonight]

**In the case**

**[CARD NAME, set/number] — $[PRICE]**

[One honest sentence on why this card, in this story.]

**One thing**

→ **[[CTA text]]([[LINK + UTM]])**

**The footnote**

[Soft ask. One sentence, conversational.]

See you at the same angle next Thursday.

— Jonathon
High End Fire Collectables
```

---

## Pre-send check — every single issue, no exceptions

**Facts**
- [ ] Every illustrator name checked against the "Illus." line on the card itself.
- [ ] Every historical claim traceable to a source I could show someone. **If I can only
      half-confirm it, it comes out** — the issue is written to survive the cut.
- [ ] No price prediction. No "will be", "set to", "grail in five years", "undervalued".
- [ ] No invented testimonial, customer, or sales figure.
- [ ] Any comp quoted is a **sold** comp, with the date, not an asking price.

**Inventory**
- [ ] Card is in stock in `index.html` right now (`data-stock` > 0).
- [ ] Price in the email matches `data-product-price` exactly.
- [ ] Link goes to the right anchor and actually loads.

**Mechanics**
- [ ] One primary CTA. Count the links — more than two total and cut one.
- [ ] UTM on every link: `?utm_source=newsletter&utm_medium=email&utm_campaign=rl-NNN`
- [ ] Subject under 45 characters; preview text is a *different* angle, not a repeat.
- [ ] Read it on a phone before sending. If it needs more than two thumb-scrolls, cut.
- [ ] Sent from "Jonathon at High End Fire", reply-to a mailbox you actually read.
- [ ] Test send to yourself; click every link in the test.

**Tone**
- [ ] Would this email be worth reading if I had nothing to sell? If no, rewrite.
- [ ] Does it sound like a collector talking, or like a shop broadcasting?
- [ ] Australian spelling throughout (colour, favourite, practise/practice, metre).

---

## After sending — log it

One row in the tracker:

`issue | date | subject | variable tested | delivered | unique clicks | CTO% | replies |
want-list adds | checkout starts | revenue | one thing I'd change`

The log is the strategy. Twelve rows in and you'll know more about your list than any
benchmark could tell you.

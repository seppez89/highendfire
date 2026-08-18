# RAKING LIGHT — issue log

State + metrics in one place. The `/raking-light` skill reads this to work out which
issue is next, and appends a `drafted` row. **You fill the rest after sending.**

**Draft numbers in this table are internal only.** They never appear in an email — the
masthead carries the date.

Ignore open rate — it's inflated by Apple Mail Privacy Protection and meaningless at this
list size. The columns that matter are **clicks**, **replies** and **want-list adds**.

| # | Theme | Subject sent | Drafted | Sent | Variable tested | Delivered | Unique clicks | CTO % | Replies | Want-list adds | Checkout starts | Revenue AUD | One thing I'd change |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 001 | Market split + two cards | *(drafted: "Two cards I'd hang on a wall")* | 2026-08-06 | — | subject: curiosity gap | | | | | | | | |
| 002 | Cards that tell a story | *(drafted: "Four Mewtwos, one case")* | 2026-08-06 | — | subject: number/specific | | | | | | | | |
| 003 | Hidden details | *(drafted: "Turn the card over first")* | 2026-08-06 | — | subject: direct callout | | | | | | | | |
| 004 | Collector education | *(drafted: "What a PSA 7 actually means")* | 2026-08-06 | — | length: ~230 words | | | | | | | | |

## Running notes

- **Weeks 1–3** test subject-line angle. **Weeks 4–6** test length (short). **Weeks 7–9**
  test CTA style. **Weeks 10–12** test send time. One variable at a time — full plan in
  `README.md` §9.
- Sequential tests, not A/B splits. The list is too small for a split to mean anything.
- After 6 issues, read the clicks column top to bottom and write down what the winning
  subjects have in common. That's your voice, found by evidence rather than guessing.

## Things that moved (keep this honest)

| Date | What changed | Why it matters to the newsletter |
|---|---|---|
| 2026-08-06 | Complete 1st Ed Fossil Set marked SOLD | Week 7's planned product — brief updated to lead with Lapras PSA 7 + Dragonite |
| 2026-08-06 | 4 listings over $5,000 switched to enquiry-only on the site | Those cards get the reply CTA in emails, never a buy link |
| 2026-08-06 | Design changed to photo-heavy dark shop style + vintage whirl hero | `template.html` rebuilt; plain-text letter version retired |
| 2026-08-06 | Market commentary now allowed (observation only, never forecast) | First issue leads on the modern/vintage split |

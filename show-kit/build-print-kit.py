#!/usr/bin/env python3
"""
Build the High End Fire card-show print kit.

Outputs:
  qr-review.svg / qr-review-print.png / qr-review-dark.svg
  print-kit.html   page 1 = A4 table sign, page 2 = 8 handout cards
  ../images/qr-review.svg + .png   the same QR for the on-screen /table sign

Rerun this after changing TARGET_URL or EVENT_LABEL:
    pip3 install segno
    python3 build-print-kit.py

Note: the QR points at highendfire.com.au/review, NOT directly at Google.
That page decides where to send people, so the printed codes never need
reprinting when the Google review link changes.
"""

import base64
import pathlib
import subprocess
import sys

try:
    import segno
except ImportError:
    sys.exit("segno not installed — run: pip3 install segno")

TARGET_URL  = "https://highendfire.com.au/review"
EVENT_LABEL = "High End Fire Collectables"

# The live Google Business Profile review link. Used for the optional
# straight-to-Google QR below; the /review page reads its own copy.
GOOGLE_REVIEW_URL = ("https://g.page/r/CbimcZkxK8FrEBM/review"
                     "?utm_source=gbp&utm_medium=reviews&utm_campaign=qr")

HERE = pathlib.Path(__file__).parent


# ---------------------------------------------------------------- QR codes
# Error correction 'h' (30%) so the code still scans with print wear,
# a bent card, or bad lighting at a show.
#
# border=4 is the QR spec's mandatory quiet zone. Do not reduce it —
# without the blank margin most scanners cannot find the symbol at all.
# Colours are opaque; a transparent QR stops scanning the moment it lands
# on anything other than a white background.
qr = segno.make(TARGET_URL, error="h")
qr.save(HERE / "qr-review.svg",       scale=10, dark="#0A0A0A", light="#FFFFFF", border=4)
qr.save(HERE / "qr-review-print.png", scale=40, dark="#0A0A0A", light="#FFFFFF", border=4)
qr.save(HERE / "qr-review-dark.svg",  scale=10, dark="#FFFFFF", light="#0A0A0A", border=4)
print(f"QR  → {TARGET_URL}  (version {qr.version}, error {qr.error})")

# Optional: straight-to-Google QR, for a small "already bought from me?" card.
# The Downloads copy Google generated is 132x132 with no quiet zone and a
# transparent background — unusable in print. This is the same link, done properly.
gqr = segno.make(GOOGLE_REVIEW_URL, error="h")
gqr.save(HERE / "qr-google-direct.png", scale=40, dark="#0A0A0A", light="#FFFFFF", border=4)
gqr.save(HERE / "qr-google-direct.svg", scale=10, dark="#0A0A0A", light="#FFFFFF", border=4)
print(f"QR  → Google direct    (version {gqr.version}, error {gqr.error})")

# ---------------------------------------------------------- web-ready copies
# The at-the-table page (/table) shows this on a screen instead of on paper,
# so the site needs its own copy in the web root. Same target, same settings —
# regenerating here keeps the printed sign and the on-screen sign identical.
WEB = HERE.parent / "images"
qr.save(WEB / "qr-review.svg", scale=10, dark="#0A0A0A", light="#FFFFFF", border=4)
qr.save(WEB / "qr-review.png", scale=20, dark="#0A0A0A", light="#FFFFFF", border=4)

# The Google review QR is what customers actually scan off the iPad standing on the
# table — it has to open Google's review form on THEIR phone, so it points straight
# at the g.page link rather than back at this site.
gqr.save(WEB / "qr-google.svg", scale=10, dark="#0A0A0A", light="#FFFFFF", border=4)
gqr.save(WEB / "qr-google.png", scale=20, dark="#0A0A0A", light="#FFFFFF", border=4)
print(f"QR  → web copies in images/  (/review + Google direct)")


# ---------------------------------------------------------------- assets
# Downscale the logo once; the full-res original is ~4 MB and bloats the
# embedded HTML for no visible gain at 50 mm print width.
logo_src   = HERE.parent / "images" / "logo.png"
logo_print = HERE / "logo-print.png"
if not logo_print.exists() or logo_print.stat().st_mtime < logo_src.stat().st_mtime:
    subprocess.run(["sips", "-Z", "700", str(logo_src), "--out", str(logo_print)],
                   check=True, capture_output=True)

def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode()

logo = b64(logo_print)
qr_b = b64(HERE / "qr-review-print.png")


# ---------------------------------------------------------------- HTML
mini = """<div class="mini">
      <div class="img qr mini__qr" role="img" aria-label="Scan to claim a free booster pack"></div>
      <div class="mini__body">
        <div class="img logo mini__logo" role="img" aria-label="High End Fire Collectables"></div>
        <div class="mini__title">FREE <em>PACK</em></div>
        <div class="mini__sub"><b>Buy a card — even a $1 one.</b><br>
          Scan, leave a review, then show me the screen.</div>
        <div class="mini__url">highendfire.com.au/review</div>
      </div>
    </div>"""

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>High End Fire — Card Show Print Kit</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  @page {{ size: A4 portrait; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0;
       -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{ font-family: 'DM Sans', sans-serif; background: #555; }}

  /* Each image is embedded once, then reused as a background.
     NB: use background-color below, never the `background` shorthand —
     the shorthand resets background-image and blanks the QR. */
  .img  {{ background-repeat: no-repeat; background-position: center; background-size: contain; }}
  .logo {{ background-image: url(data:image/png;base64,{logo}); }}
  .qr   {{ background-image: url(data:image/png;base64,{qr_b}); }}

  .sheet {{ width: 210mm; height: 297mm; background-color: #fff; margin: 0 auto 10mm;
            page-break-after: always; position: relative; overflow: hidden; }}
  .sheet:last-child {{ page-break-after: auto; margin-bottom: 0; }}

  /* ---------- PAGE 1 — table sign ---------- */
  .sign {{ padding: 16mm 16mm 12mm; display: flex; flex-direction: column;
           align-items: center; text-align: center; height: 100%; }}
  .sign__logo {{ width: 46mm; height: 46mm; margin-bottom: 1mm; }}
  .sign__kicker {{ font-size: 4.2mm; font-weight: 700; letter-spacing: .22em;
                   text-transform: uppercase; color: #E05C2A; margin-bottom: 4mm; }}
  .sign__title {{ font-family: 'Bebas Neue', Impact, sans-serif; font-size: 29mm;
                  line-height: .88; letter-spacing: .01em; color: #0A0A0A; margin-bottom: 4mm; }}
  .sign__title em {{ font-style: normal; color: #E05C2A; display: block; }}
  .sign__sub {{ font-size: 5.4mm; font-weight: 500; color: #333; margin-bottom: 6mm; line-height: 1.35; }}
  .sign__qr {{ width: 74mm; height: 74mm; border: 1.4mm solid #0A0A0A; border-radius: 4mm;
               padding: 3mm; background-color: #fff; }}
  .sign__scan {{ font-family: 'Bebas Neue', Impact, sans-serif; font-size: 10mm;
                 letter-spacing: .05em; color: #0A0A0A; margin-top: 4mm; }}
  .sign__steps {{ display: flex; gap: 8mm; margin-top: 4mm; justify-content: center; }}
  .sign__step {{ font-size: 4.2mm; color: #444; font-weight: 500; }}
  .sign__step b {{ display: block; font-size: 6.5mm; color: #E05C2A; font-weight: 700; }}
  .sign__url {{ margin-top: auto; font-size: 4.8mm; font-weight: 700;
                color: #0A0A0A; letter-spacing: .04em; }}

  /* ---------- PAGE 2 — 8-up handout cards ---------- */
  .grid {{ display: grid; grid-template-columns: 1fr 1fr;
           grid-template-rows: repeat(4, 1fr); height: 100%; }}
  .mini {{ border: .3mm dashed #bbb; padding: 5mm; display: flex; align-items: center; gap: 4mm; }}
  .mini__qr {{ width: 26mm; height: 26mm; flex: 0 0 auto; }}
  .mini__body {{ flex: 1; min-width: 0; }}
  .mini__logo {{ width: 22mm; height: 12mm; background-position: left center; margin-bottom: 1mm; }}
  .mini__title {{ font-family: 'Bebas Neue', Impact, sans-serif; font-size: 8mm;
                  line-height: .95; color: #0A0A0A; letter-spacing: .01em; }}
  .mini__title em {{ font-style: normal; color: #E05C2A; }}
  .mini__sub {{ font-size: 3.2mm; color: #444; line-height: 1.35; margin-top: 1.2mm; }}
  .mini__url {{ font-size: 3mm; font-weight: 700; color: #0A0A0A;
                margin-top: 1.5mm; letter-spacing: .02em; }}

  @media screen {{ body {{ padding: 10mm 0; }} .sheet {{ box-shadow: 0 4px 24px rgba(0,0,0,.4); }} }}
</style>
</head>
<body>

<!-- ====== PAGE 1: table sign — print A4, stand it in a cheap photo frame ====== -->
<div class="sheet">
  <div class="sign">
    <div class="img logo sign__logo" role="img" aria-label="High End Fire Collectables"></div>
    <div class="sign__kicker">{EVENT_LABEL}</div>
    <h1 class="sign__title">FREE<em>BOOSTER PACK</em></h1>
    <p class="sign__sub"><b>Buy a card &mdash; even a $1 one.</b><br>
       Scan the code, leave a review, grab a free pack.</p>
    <div class="img qr sign__qr" role="img" aria-label="Opens highendfire.com.au/review"></div>
    <div class="sign__scan">SCAN TO REVIEW</div>
    <div class="sign__steps">
      <div class="sign__step"><b>1</b>Buy a card</div>
      <div class="sign__step"><b>2</b>Leave a review</div>
      <div class="sign__step"><b>3</b>Free pack</div>
    </div>
    <div class="sign__url">highendfire.com.au/review</div>
  </div>
</div>

<!-- ====== PAGE 2: 8 handout cards — cut along the dashed lines ====== -->
<div class="sheet">
  <div class="grid">
    {chr(10).join(["    " + mini] * 8).strip()}
  </div>
</div>

</body>
</html>
"""

out = HERE / "print-kit.html"
out.write_text(html)
print(f"HTML → {out}  ({len(html) // 1024} KB)")

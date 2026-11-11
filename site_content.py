"""Words that appear on generated pages. Edit here, then run build-site.py.

Kept apart from the build scripts so copy can be changed without touching
code. Everything in this file is published, so it only states things that
have been checked. If a set isn't listed in SETS, its product pages simply
don't show an "About the set" note. Don't guess to fill a gap.
"""

# ---------------------------------------------------------------------------
# "About the set" notes for product pages.
# A card opts in with  data-set="<key>"  on its block in shop.html.
# ---------------------------------------------------------------------------
SETS = {
    "base-set": ("Base Set (1999)",
        "The first English Pokemon TCG set, printed by Wizards of the Coast and released in January 1999. "
        "It has 102 cards, 16 of them holographic rares, and came in 1st Edition, Shadowless and Unlimited print runs."),
    "jungle": ("Jungle (1999)",
        "The first English expansion, released by Wizards of the Coast in June 1999. "
        "A 64-card set that brought the Eevee evolutions Vaporeon, Jolteon and Flareon into the card game."),
    "fossil": ("Fossil (1999)",
        "Wizards of the Coast's second English expansion, released in October 1999. "
        "A 62-card set whose holos include Dragonite, Gengar, Lapras and the three legendary birds."),
    "team-rocket": ("Team Rocket (2000)",
        "Released by Wizards of the Coast in April 2000. The first set built around a villain team, "
        "it introduced Dark Pokemon such as Dark Charizard and Dark Blastoise."),
    "mystery-of-the-fossils-jp": ("Mystery of the Fossils (1997, Japanese)",
        "The original Japanese release of the set English collectors know as Fossil, "
        "printed in 1997 with the old Japanese card back."),
    "ex-delta-species": ("EX Delta Species (2005)",
        "An EX-era set released in October 2005. Its Delta Species Pokemon appear as different types "
        "from usual and are marked with a δ symbol."),
    "team-up": ("Team Up (2019)",
        "A Sun & Moon set released in February 2019. It introduced Tag Team GX cards, "
        "which put two Pokemon on one card."),
    "hidden-fates": ("Hidden Fates (2019)",
        "A special Sun & Moon set released in August 2019 and sold only in boxes and tins, "
        "not in booster boxes. Best known for its Shiny Vault subset."),
    "tag-all-stars-jp": ("Tag All Stars SM12a (2019, Japanese)",
        "A Japanese high-class pack released in October 2019 that gathered the Tag Team GX cards "
        "of the Sun & Moon era into one set."),
    "dream-league-jp": ("Dream League SM11b (2019, Japanese)",
        "A Japanese Sun & Moon subset released in August 2019. Its Character Rares (CHR) "
        "show a Pokemon alongside its trainer."),
    "lost-origin": ("Lost Origin (2022)",
        "A Sword & Shield set released in September 2022, with a 30-card Trainer Gallery subset "
        "numbered TG01 to TG30."),
    "silver-tempest": ("Silver Tempest (2022)",
        "The last main Sword & Shield expansion, released in November 2022, with its own "
        "Trainer Gallery subset numbered TG01 to TG30."),
    "swsh-charizard-upc": ("Charizard Ultra-Premium Collection (2022)",
        "This Black Star Promo comes from the Sword & Shield Ultra-Premium Collection: Charizard, "
        "released in October 2022."),
    "crown-zenith": ("Crown Zenith (2023)",
        "The final Sword & Shield special set, released in January 2023. Its 70-card Galarian Gallery "
        "subset is numbered GG01 to GG70."),
    "paldea-evolved": ("Paldea Evolved (2023)",
        "The second Scarlet & Violet expansion, released in June 2023."),
    "151": ("Scarlet & Violet 151 (2023)",
        "A special set released in September 2023 covering the original 151 Pokemon in Pokedex order."),
    "paldean-fates": ("Paldean Fates (2024)",
        "A special Scarlet & Violet set released in January 2024, built around Shiny Pokemon."),
    "destined-rivals": ("Destined Rivals (2025)",
        "A Scarlet & Violet expansion released in May 2025, built around Team Rocket's Pokemon."),
    "black-bolt": ("Black Bolt (2025)",
        "Released in July 2025 alongside White Flare. Between them the two sets cover every Pokemon "
        "from the Unova region."),
    "vstar-universe-jp": ("VSTAR Universe s12a (2022, Japanese)",
        "A Japanese high-class pack released in December 2022, the closing set of the Sword & Shield era in Japan."),
    "battle-region-jp": ("Battle Region s9a (2022, Japanese)",
        "A Japanese Sword & Shield subset released in February 2022."),
    "shiny-collection-jp": ("Shiny Collection (2013, Japanese)",
        "A Japanese Black & White concept pack released in February 2013 in which every card is holofoil."),
    "lost-abyss-jp": ("Lost Abyss s11 (2022, Japanese)",
        "A Japanese Sword & Shield expansion released in July 2022, headlined by Giratina VSTAR."),
    "25th-anniversary-jp": ("25th Anniversary Collection s8a (2021, Japanese)",
        "A Japanese set released in October 2021 for the 25th anniversary of Pokemon."),
    "paradigm-trigger-jp": ("Paradigm Trigger s12 (2022, Japanese)",
        "A Japanese Sword & Shield expansion released in October 2022, headlined by Lugia VSTAR."),
    "terastal-festival-jp": ("Terastal Festival ex sv8a (2024, Japanese)",
        "A Japanese high-class pack released in December 2024, built around Eevee and its evolutions."),
    "triple-beat-jp": ("Triplet Beat sv1a (2023, Japanese)",
        "A Japanese Scarlet & Violet subset released in March 2023."),
}

# ---------------------------------------------------------------------------
# Condition notes for product pages, chosen from data-product-condition.
# ---------------------------------------------------------------------------
PSA_GRADES = {10: "Gem Mint", 9: "Mint", 8: "Near Mint-Mint", 7: "Near Mint"}

CONDITION_NOTES = {
    "SEALED": "Factory sealed and unopened.",
    "MINT": "Mint: pack-fresh, with no visible wear.",
    "NEAR MINT": "Near Mint: looks unplayed. At most a touch of edge or corner whitening that shows only on a close look.",
    "LIGHTLY PLAYED": "Lightly Played: light wear that shows on a close look, such as some edge whitening or faint surface marks.",
    "NM-LP": "Between Near Mint and Lightly Played: mostly clean, with a little wear that shows on a close look.",
    "MP": "Moderately Played: clear wear from handling, such as whitening, surface marks or soft corners.",
    "": "Raw and ungraded.",
}
RAW_FOOTNOTE = ("Every single is photographed so you can see exactly what you're getting. "
                "Want more photos or a video first? Just ask.")

# ---------------------------------------------------------------------------
# "Buying from High End Fire" on product pages. Shipping figures mirror
# api/checkout.js, which is what the customer is actually charged.
# ---------------------------------------------------------------------------
BUYING = [
    ("Shipping", "$10 AUD tracked shipping Australia-wide, usually 3 to 7 business days. "
                 "International: Standard $50 AUD (10 to 20 days) or Express $80 AUD (3 to 7 days)."),
    ("Packaging", "Every order is tracked and securely packaged. Singles ship sleeved in a rigid toploader inside a bubble mailer."),
    ("Returns", 'No change-of-mind returns. If something arrives damaged, faulty or not as described, '
                'you are covered under Australian Consumer Law. See the <a href="/refund">returns policy</a>.'),
    ("Questions", 'Want more photos, a video or a second opinion on condition? <a href="/#contact">Send an enquiry</a>.'),
]
BUYING_ENQUIRY = ("How this piece is sold",
                  "Pieces at this level are sold by enquiry, not through the cart. "
                  "Get in touch and I'll send more photos or a video and arrange payment and delivery with you directly.")

# ---------------------------------------------------------------------------
# Buying guides shown under the grid on each category page.
# {category slug: (heading, [(sub-heading, paragraph html), ...])}
# ---------------------------------------------------------------------------
GUIDES = {
    "pokemon-cards": ("Buying Pokemon cards from High End Fire", [
        ("A collector's case, not a warehouse",
         "Each card here is one I sourced, checked over and photographed myself. Most singles are one of one: "
         "when a piece sells it moves to the <a href=\"/sold\">sold archive</a> and something new takes its place."),
        ("Raw or graded",
         "Raw cards are listed with a condition such as Mint, Near Mint or Lightly Played, and the photos show the card itself. "
         "<a href=\"/graded-cards\">Graded cards</a> come sealed in a PSA case with the grade and certification number on the label."),
        ("Where to start",
         "Browse <a href=\"/vintage-pokemon-cards\">vintage WOTC-era cards</a>, "
         "<a href=\"/japanese-pokemon-cards\">Japanese cards</a> or "
         "<a href=\"/sealed-pokemon\">sealed booster boxes</a>, or sort this page by price."),
    ]),
    "sealed-pokemon": ("Buying sealed Pokemon product", [
        ("What sealed means here",
         "Factory sealed and unopened: booster boxes, Elite Trainer Boxes and booster bundles. "
         "Each listing shows how many are in stock."),
        ("English and Japanese boxes",
         "Japanese and English boxes are not the same size, and pack counts differ from set to set. "
         "If a listing doesn't say how many packs are inside, <a href=\"/#contact\">ask before you buy</a>."),
        ("Shipping",
         "Flat $10 AUD tracked shipping Australia-wide, and worldwide delivery from $50 AUD."),
    ]),
    "graded-cards": ("Buying PSA graded cards", [
        ("How PSA grades work",
         "PSA grades cards from 1 to 10. A 10 is Gem Mint and a 9 is Mint. Every slab carries a certification "
         "number on its label, which you can look up on PSA's website to confirm the card and grade."),
        ("Why some slabs say Enquire",
         "The top-end pieces are sold in conversation, not through the cart. You can ask for more photos or a video, "
         "and payment and delivery are arranged with you directly."),
    ]),
    "japanese-pokemon-cards": ("Buying Japanese Pokemon cards", [
        ("Why collectors buy Japanese",
         "Japan gets promos and sets that never see an identical English release, and many collectors rate "
         "Japanese print quality highly. This page covers singles, promos and sealed boxes."),
        ("Old back cards",
         "\"Old back\" means the original Japanese card back, used until the design changed in 2001. "
         "These are the Japanese cards from the same years as the English WOTC sets."),
    ]),
    "vintage-pokemon-cards": ("Buying vintage Pokemon cards", [
        ("What counts as vintage here",
         "Cards from 1996 to 2003. In English that is the Wizards of the Coast era, which ran from Base Set in 1999 "
         "to Skyridge in 2003. The Japanese cards from those years are here too."),
        ("Condition is everything",
         "These cards are over twenty years old, so condition varies and drives the price. Each listing states the "
         "condition, and the photos show the card itself. Ask if you want more photos or a video."),
    ]),
    "dragon-ball-cards": ("Buying Dragon Ball Fusion World cards", [
        ("What's here",
         "Singles from Dragon Ball Super Card Game Fusion World, which launched in 2024: secret rares, "
         "alternate arts, gold energy markers and PSA-graded prize cards."),
    ]),
    "one-piece-cards": ("Buying One Piece Card Game", [
        ("What's here",
         "One Piece Card Game is published by Bandai. Its first English set, Romance Dawn, was released in December 2022. "
         "This page holds graded singles and sealed product."),
    ]),
}

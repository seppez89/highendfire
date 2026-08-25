/* ============================================
   HIGH END FIRE — Lightbox Image Viewer
   Desktop: click-to-zoom + mousemove pan
   Mobile:  pinch-to-zoom, double-tap, swipe,
            pan when zoomed, fullscreen viewer
   ============================================ */

(function () {
  'use strict';

  // --- Per-product image galleries ---
  var PRODUCT_IMAGES = {
    'ascended-heroes-booster-bundle': [
      '/images/products/ascended-heroes-booster-bundle-1.webp'
    ],
    'db-energy-marker-e78': [
      '/images/products/db-energy-marker-e78-1.webp',
      '/images/products/db-energy-marker-e78-2.webp',
      '/images/products/db-energy-marker-e78-3.webp'
    ],
    'mewtwo-12-delta-species-raw': [
      '/images/products/mewtwo-12-delta-species-raw-1.webp',
      '/images/products/mewtwo-12-delta-species-raw-2.webp',
      '/images/products/mewtwo-12-delta-species-raw-3.webp'
    ],
    'db-frieza-sb02-054-sr': [
      '/images/products/db-frieza-sb02-054-sr-1.webp',
      '/images/products/db-frieza-sb02-054-sr-2.webp',
      '/images/products/db-frieza-sb02-054-sr-3.webp'
    ],
    'machamp-8-base-set-1st-ed': [
      '/images/products/machamp-8-base-set-1st-ed-1.webp',
      '/images/products/machamp-8-base-set-1st-ed-2.webp',
      '/images/products/machamp-8-base-set-1st-ed-3.webp'
    ],
    'gyarados-6-base-set': [
      '/images/products/gyarados-6-base-set-1.webp',
      '/images/products/gyarados-6-base-set-2.webp',
      '/images/products/gyarados-6-base-set-3.webp'
    ],
    'magneton-9-base-set': [
      '/images/products/magneton-9-base-set-1.webp',
      '/images/products/magneton-9-base-set-2.webp',
      '/images/products/magneton-9-base-set-3.webp'
    ],
    'alakazam-ex-201-151-sir': [
      '/images/products/alakazam-ex-201-151-sir-1.webp',
      '/images/products/alakazam-ex-201-151-sir-2.webp',
      '/images/products/alakazam-ex-201-151-sir-3.webp'
    ],
    'vaporeon-12-jungle': [
      '/images/products/vaporeon-12-jungle-1.webp',
      '/images/products/vaporeon-12-jungle-2.webp',
      '/images/products/vaporeon-12-jungle-3.webp'
    ],
    'nidoqueen-7-jungle': [
      '/images/products/nidoqueen-7-jungle-1.webp',
      '/images/products/nidoqueen-7-jungle-2.webp',
      '/images/products/nidoqueen-7-jungle-3.webp'
    ],
    'fuecoco-201-paldea-evolved-ir': [
      '/images/products/fuecoco-201-paldea-evolved-ir-1.webp',
      '/images/products/fuecoco-201-paldea-evolved-ir-2.webp',
      '/images/products/fuecoco-201-paldea-evolved-ir-3.webp'
    ],
    'skeledirge-ex-258-paldea-evolved-sir': [
      '/images/products/skeledirge-ex-258-paldea-evolved-sir-1.webp',
      '/images/products/skeledirge-ex-258-paldea-evolved-sir-2.webp',
      '/images/products/skeledirge-ex-258-paldea-evolved-sir-3.webp'
    ],
    'charizard-vmax-swsh261-promo': [
      '/images/products/charizard-vmax-swsh261-promo-1.webp',
      '/images/products/charizard-vmax-swsh261-promo-2.webp',
      '/images/products/charizard-vmax-swsh261-promo-3.webp'
    ],
    'charizard-vstar-swsh262-promo': [
      '/images/products/charizard-vstar-swsh262-promo-1.webp',
      '/images/products/charizard-vstar-swsh262-promo-2.webp',
      '/images/products/charizard-vstar-swsh262-promo-3.webp'
    ],
    'mewtwo-10-base-set': [
      '/images/products/mewtwo-10-base-set-1.webp',
      '/images/products/mewtwo-10-base-set-2.webp',
      '/images/products/mewtwo-10-base-set-3.webp'
    ],
    'nami-007-op06-treasure-rare-psa10': [
      '/images/products/nami-007-op06-treasure-rare-psa10-1.webp',
      '/images/products/nami-007-op06-treasure-rare-psa10-2.webp',
      '/images/products/nami-007-op06-treasure-rare-psa10-3.webp'
    ],
    'mewtwo-mew-gx-052-tag-all-stars-jp': [
      '/images/products/mewtwo-mew-gx-052-tag-all-stars-jp-1.webp',
      '/images/products/mewtwo-mew-gx-052-tag-all-stars-jp-2.webp',
      '/images/products/mewtwo-mew-gx-052-tag-all-stars-jp-3.webp'
    ],
    'moltres-zapdos-articuno-gx-44-hidden-fates': [
      '/images/products/moltres-zapdos-articuno-gx-44-hidden-fates-1.webp',
      '/images/products/moltres-zapdos-articuno-gx-44-hidden-fates-2.webp',
      '/images/products/moltres-zapdos-articuno-gx-44-hidden-fates-3.webp'
    ],
    'rayquaza-vmax-tg20-silver-tempest': [
      '/images/products/rayquaza-vmax-tg20-silver-tempest-1.webp',
      '/images/products/rayquaza-vmax-tg20-silver-tempest-2.webp',
      '/images/products/rayquaza-vmax-tg20-silver-tempest-3.webp'
    ],
    'gengar-mimikyu-gx-53-team-up': [
      '/images/products/gengar-mimikyu-gx-53-team-up-1.webp',
      '/images/products/gengar-mimikyu-gx-53-team-up-2.webp',
      '/images/products/gengar-mimikyu-gx-53-team-up-3.webp'
    ],
    'piplup-052-dream-league-chr-jp': [
      '/images/products/piplup-052-dream-league-chr-jp-1.webp',
      '/images/products/piplup-052-dream-league-chr-jp-2.webp',
      '/images/products/piplup-052-dream-league-chr-jp-3.webp'
    ],
    'pikachu-vmax-tg17-lost-origin': [
      '/images/products/pikachu-vmax-tg17-lost-origin-1.webp',
      '/images/products/pikachu-vmax-tg17-lost-origin-2.webp',
      '/images/products/pikachu-vmax-tg17-lost-origin-3.webp'
    ],
    'seismitoad-105-black-bolt-ir': [
      '/images/products/seismitoad-105-black-bolt-ir-1.webp',
      '/images/products/seismitoad-105-black-bolt-ir-2.webp',
      '/images/products/seismitoad-105-black-bolt-ir-3.webp'
    ],
    'dark-charmeleon-32-team-rocket-stamped': [
      '/images/products/dark-charmeleon-32-team-rocket-stamped-1.webp',
      '/images/products/dark-charmeleon-32-team-rocket-stamped-2.webp'
    ],
    'db-energy-marker-e81': [
      '/images/products/db-energy-marker-e81-1.webp',
      '/images/products/db-energy-marker-e81-2.webp',
      '/images/products/db-energy-marker-e81-3.webp',
      '/images/products/db-energy-marker-e81-4.webp'
    ],
    'mewtwo-ex-125-glory': [
      '/images/products/mewtwo-ex-125-glory-1.webp',
      '/images/products/mewtwo-ex-125-glory-2.webp'
    ],
    'mew-ex-232': [
      '/images/products/mew-ex-232-1.webp',
      '/images/products/mew-ex-232-3.webp'
    ],
    'mewtwo-ex-240-destined': [
      '/images/products/mewtwo-ex-240-destined-1.webp',
      '/images/products/mewtwo-ex-240-destined-2.webp'
    ],
    'lillie-sar-091': [
      '/images/products/lillie-sar-091-1.webp',
      '/images/products/lillie-sar-091-2.webp'
    ],
    'cynthia-sv82-hidden-fates': [
      '/images/products/cynthia-sv82-hidden-fates-1.webp',
      '/images/products/cynthia-sv82-hidden-fates-2.webp'
    ],
    'op-romance-dawn-blue': [
      '/images/products/op-romance-dawn-blue-1.webp',
      '/images/products/op-romance-dawn-blue-2.webp',
      '/images/products/op-romance-dawn-blue-3.webp',
      '/images/products/op-romance-dawn-blue-4.webp',
      '/images/products/op-romance-dawn-blue-5.webp',
      '/images/products/op-romance-dawn-blue-6.webp'
    ],
    'fossil-set-1st-ed': [
      '/images/products/fossil-set-1st-ed-1.webp',
      '/images/products/fossil-set-1st-ed-2.webp',
      '/images/products/fossil-set-1st-ed-3.webp',
      '/images/products/fossil-set-1st-ed-4.webp',
      '/images/products/fossil-set-1st-ed-5.webp',
      '/images/products/fossil-set-1st-ed-6.webp',
      '/images/products/fossil-set-1st-ed-7.webp',
      '/images/products/fossil-set-1st-ed-8.webp',
      '/images/products/fossil-set-1st-ed-9.webp',
      '/images/products/fossil-set-1st-ed-10.webp'
    ],
    'articuno-fossil-holo': [
      '/images/products/articuno-fossil-holo-1.webp',
      '/images/products/articuno-fossil-holo-2.webp'
    ],
    'dragonite-fossil-holo': [
      '/images/products/dragonite-fossil-holo-1.webp',
      '/images/products/dragonite-fossil-holo-2.webp'
    ],
    'pikachu-323-sp-precious': [
      '/images/products/pikachu-323-sp-precious-1.webp',
      '/images/products/pikachu-323-sp-precious-2.webp',
      '/images/products/pikachu-323-sp-precious-3.webp'
    ],
    'leafeon-vstar-gg35-crown-zenith': [
      '/images/products/leafeon-vstar-gg35-crown-zenith-1.webp',
      '/images/products/leafeon-vstar-gg35-crown-zenith-2.webp',
      '/images/products/leafeon-vstar-gg35-crown-zenith-3.webp'
    ],
    'mew-gg10-crown-zenith': [
      '/images/products/mew-gg10-crown-zenith-1.webp',
      '/images/products/mew-gg10-crown-zenith-2.webp',
      '/images/products/mew-gg10-crown-zenith-3.webp'
    ],
    'gengar-094-mystery-fossils-1997': [
      '/images/products/gengar-094-mystery-fossils-1997-1.webp',
      '/images/products/gengar-094-mystery-fossils-1997-2.webp',
      '/images/products/gengar-094-mystery-fossils-1997-3.webp'
    ],
    'mewtwo-holo-delta-species-psa9': [
      '/images/products/mewtwo-holo-delta-species-psa9-1.webp',
      '/images/products/mewtwo-holo-delta-species-psa9-2.webp'
    ],
    'shining-lugia-sm82-promo-psa10': [
      '/images/products/shining-lugia-sm82-promo-psa10-1.webp',
      '/images/products/shining-lugia-sm82-promo-psa10-2.webp'
    ],
    'tohoku-pikachu-088-sm-p': [
      '/images/products/tohoku-pikachu-088-sm-p-1.webp',
      '/images/products/tohoku-pikachu-088-sm-p-2.webp',
      '/images/products/tohoku-pikachu-088-sm-p-3.webp'
    ],
    'mega-dragonite-ex-271-ascended-heroes': [
      '/images/products/mega-dragonite-ex-271-ascended-heroes-1.webp',
      '/images/products/mega-dragonite-ex-271-ascended-heroes-2.webp',
      '/images/products/mega-dragonite-ex-271-ascended-heroes-3.webp'
    ],
    'shining-mew-corocoro': [
      '/images/products/shining-mew-corocoro-1.webp',
      '/images/products/shining-mew-corocoro-2.webp',
      '/images/products/shining-mew-corocoro-3.webp'
    ],
    'mew-ex-024-shiny-collection-jp': [
      '/images/products/mew-ex-024-shiny-collection-jp-1.webp',
      '/images/products/mew-ex-024-shiny-collection-jp-2.webp'
    ],
    'poliwrath-109-1st-ed-e-series-jp': [
      '/images/products/poliwrath-109-1st-ed-e-series-jp-1.webp',
      '/images/products/poliwrath-109-1st-ed-e-series-jp-2.webp',
      '/images/products/poliwrath-109-1st-ed-e-series-jp-3.webp'
    ],
    'son-gohan-youth-fb03-139-scr-raging-roar': [
      '/images/products/son-gohan-youth-fb03-139-scr-raging-roar-1.webp',
      '/images/products/son-gohan-youth-fb03-139-scr-raging-roar-2.webp',
      '/images/products/son-gohan-youth-fb03-139-scr-raging-roar-3.webp'
    ],
    'dark-feraligatr-160-neo-destiny-jp': [
      '/images/products/dark-feraligatr-160-neo-destiny-jp-1.webp',
      '/images/products/dark-feraligatr-160-neo-destiny-jp-2.webp',
      '/images/products/dark-feraligatr-160-neo-destiny-jp-3.webp'
    ],
    'son-goku-gt-fb07-122-sr-wish-shenron': [
      '/images/products/son-goku-gt-fb07-122-sr-wish-shenron-1.webp',
      '/images/products/son-goku-gt-fb07-122-sr-wish-shenron-2.webp',
      '/images/products/son-goku-gt-fb07-122-sr-wish-shenron-3.webp'
    ],
    'machoke-177-illustration-rare-151': [
      '/images/products/machoke-177-illustration-rare-151-1.webp',
      '/images/products/machoke-177-illustration-rare-151-2.webp',
      '/images/products/machoke-177-illustration-rare-151-3.webp'
    ],
    'team-rockets-moltres-ex-sar-124': [
      '/images/products/team-rockets-moltres-ex-sar-124-1.webp',
      '/images/products/team-rockets-moltres-ex-sar-124-2.webp',
      '/images/products/team-rockets-moltres-ex-sar-124-3.webp'
    ],
    'raditz-sb01-026-sr-alt-art': [
      '/images/products/raditz-sb01-026-sr-alt-art-1.webp',
      '/images/products/raditz-sb01-026-sr-alt-art-2.webp',
      '/images/products/raditz-sb01-026-sr-alt-art-3.webp'
    ],
    'starmie-v-csr-083-battle-region': [
      '/images/products/starmie-v-csr-083-battle-region-1.webp',
      '/images/products/starmie-v-csr-083-battle-region-2.webp',
      '/images/products/starmie-v-csr-083-battle-region-3.webp'
    ],
    'mewtwo-vstar-221-vstar-universe': [
      '/images/products/mewtwo-vstar-221-vstar-universe-1.webp',
      '/images/products/mewtwo-vstar-221-vstar-universe-2.webp',
      '/images/products/mewtwo-vstar-221-vstar-universe-3.webp'
    ],
    'charizard-092-stormfront-jp-psa10': [
      '/images/products/charizard-092-stormfront-jp-psa10-1.webp',
      '/images/products/charizard-092-stormfront-jp-psa10-2.webp'
    ],
    'lapras-10-fossil-1st-ed-psa7': [
      '/images/products/lapras-10-fossil-1st-ed-psa7-1.webp',
      '/images/products/lapras-10-fossil-1st-ed-psa7-2.webp'
    ],
    'pikachu-001-gold-star-gift-box-psa9': [
      '/images/products/pikachu-001-gold-star-gift-box-psa9-1.webp',
      '/images/products/pikachu-001-gold-star-gift-box-psa9-2.webp'
    ],
    'son-goku-fp001-fusion-world-psa10': [
      '/images/products/son-goku-fp001-fusion-world-psa10-1.webp',
      '/images/products/son-goku-fp001-fusion-world-psa10-2.webp'
    ],
    'mega-greninja-ex-122-gold': [
      '/images/products/mega-greninja-ex-122-gold-1.webp',
      '/images/products/mega-greninja-ex-122-gold-2.webp'
    ],
    'dragonite-149-gb-promo-jp': [
      '/images/products/dragonite-149-gb-promo-jp-1.webp',
      '/images/products/dragonite-149-gb-promo-jp-2.webp'
    ],
    'golduck-177-sp-gym-promo': [
      '/images/products/golduck-177-sp-gym-promo-1.webp',
      '/images/products/golduck-177-sp-gym-promo-2.webp'
    ],
    'pitch-black-booster-box': [
      '/images/products/pitch-black-booster-box-1.webp',
      '/images/products/pitch-black-booster-box-2.webp',
      '/images/products/pitch-black-booster-box-3.webp'
    ],
    'pitch-black-etb': [
      '/images/products/pitch-black-etb-1.webp',
      '/images/products/pitch-black-etb-2.webp',
      '/images/products/pitch-black-etb-3.webp'
    ],
    'chaos-rising-booster-bundle': [
      '/images/products/chaos-rising-booster-bundle-1.webp'
    ],
    'sv10-destined-rivals-booster-box': [
      '/images/products/sv10-destined-rivals-booster-box-1.webp'
    ],
    'pitch-black-booster-bundle': [
      '/images/products/pitch-black-booster-bundle-1.webp',
      '/images/products/pitch-black-booster-bundle-2.webp'
    ]
  };

  var products = [];
  var currentProductIndex = 0;
  var currentImageIndex = 0;
  var isTouch = 'ontouchstart' in window;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  function buildProductList() {
    products = [];
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      products.push({
        id:        id,
        name:      card.getAttribute('data-product-name') || '',
        condition: card.getAttribute('data-product-condition') || '',
        price:     parseFloat(card.getAttribute('data-product-price')) || 0,
        // cart.js has already stamped data-enquiry-only on anything over the
        // threshold by the time this runs (it loads first, below the cards), so
        // this covers both the hand-marked cards and the automatic ones.
        enquiryOnly: card.hasAttribute('data-enquiry-only'),
        images:    PRODUCT_IMAGES[id] || [card.getAttribute('data-product-image')]
      });
    });
  }

  function createLightbox() {
    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = [
      '<div class="lightbox__backdrop" id="lbBackdrop"></div>',
      '<div class="lightbox__panel">',
      '  <button class="lightbox__close" id="lbClose" aria-label="Close">&times;</button>',

      '  <!-- Left: image area -->',
      '  <div class="lightbox__left">',
      '    <button class="lightbox__arrow lightbox__arrow--prev" id="lbImgPrev" aria-label="Previous image">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
      '    </button>',
      '    <div class="lightbox__main-image" id="lbMainImage">',
      '      <img id="lbImg" src="" alt="" class="lightbox__img" draggable="false">',
      '    </div>',
      '    <button class="lightbox__arrow lightbox__arrow--next" id="lbImgNext" aria-label="Next image">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
      '    </button>',
      '    <!-- Image counter (mobile) -->',
      '    <div class="lightbox__counter" id="lbCounter"></div>',
      '    <!-- Zoom hint -->',
      '    <div class="lightbox__zoom-hint" id="lbZoomHint">',
      '      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>',
      '      <span id="lbZoomText">Click to zoom</span>',
      '    </div>',
      '    <!-- Thumbnail strip -->',
      '    <div class="lightbox__thumbs" id="lbThumbs"></div>',
      '  </div>',

      '  <!-- Right: product info -->',
      '  <div class="lightbox__right" id="lbRight">',
      '    <span class="lightbox__condition" id="lbCondition"></span>',
      '    <h3 class="lightbox__name" id="lbName"></h3>',
      '    <div class="lightbox__price-row">',
      '      <span class="lightbox__price" id="lbPrice"></span>',
      '    </div>',
      '    <button class="btn btn--primary btn--lg btn--full lb-add-to-cart" id="lbAddToCart">',
      '      Add to Cart',
      '      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      '    </button>',
      '    <div class="lightbox__nav-products">',
      '      <button class="lightbox__prod-nav" id="lbProdPrev">',
      '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
      '        Prev item',
      '      </button>',
      '      <span class="lightbox__prod-counter" id="lbProdCounter"></span>',
      '      <button class="lightbox__prod-nav" id="lbProdNext">',
      '        Next item',
      '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(lb);
  }

  function openLightbox(productIndex) {
    currentProductIndex = productIndex;
    currentImageIndex = 0;
    renderLightbox();
    document.getElementById('lightbox').classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
    // Show zoom hint briefly on mobile
    if (isMobile) {
      var hint = document.getElementById('lbZoomHint');
      if (hint) {
        hint.classList.add('lightbox__zoom-hint--show');
        setTimeout(function () { hint.classList.remove('lightbox__zoom-hint--show'); }, 3000);
      }
    }
  }

  function closeLightbox() {
    resetZoom();
    document.getElementById('lightbox').classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  // =============================================
  // ZOOM & PAN — simple container-space model
  // transform-origin: 0 0
  // transform: translate(x, y) scale(s)
  // When s=1, x=y=0 → img fills container normally.
  // When s>1, pan bounds: x ∈ [cw*(1-s), 0], y ∈ [ch*(1-s), 0]
  // =============================================
  var MIN_SCALE = 1;
  var MAX_SCALE = 5;
  var DOUBLE_TAP_SCALE = 2.75;

  var zoom = {
    scale: 1,
    x: 0,
    y: 0,
    // pinch
    pinchStartDist: 0,
    pinchStartScale: 1,
    pinchCenterX: 0,
    pinchCenterY: 0,
    pinchStartX: 0,
    pinchStartY: 0,
    isPinching: false,
    // pan
    panStartFingerX: 0,
    panStartFingerY: 0,
    panStartX: 0,
    panStartY: 0,
    isPanning: false,
    // swipe
    swipeStartX: 0,
    swipeStartY: 0,
    swipeStartTime: 0,
    // double tap
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0
  };

  function getWrap() { return document.getElementById('lbMainImage'); }
  function getImg()  { return document.getElementById('lbImg'); }

  function applyTransform(animate) {
    var img = getImg();
    if (!img) return;
    img.style.transition = animate ? 'transform 0.28s cubic-bezier(.25,.46,.45,.94)' : 'none';
    img.style.transformOrigin = '0 0';
    img.style.transform = 'translate3d(' + zoom.x + 'px, ' + zoom.y + 'px, 0) scale(' + zoom.scale + ')';

    var wrap = getWrap();
    if (wrap) {
      var isZoomed = zoom.scale > 1.02;
      wrap.classList.toggle('is-zoomed', isZoomed);
      var left = wrap.parentElement;
      if (left) left.classList.toggle('is-zoomed-parent', isZoomed);
    }
  }

  function clampPan() {
    var wrap = getWrap();
    if (!wrap) return;
    var cw = wrap.clientWidth;
    var ch = wrap.clientHeight;
    var s  = zoom.scale;

    if (s <= 1) {
      zoom.x = 0;
      zoom.y = 0;
      return;
    }
    var minX = cw * (1 - s);
    var minY = ch * (1 - s);
    if (zoom.x > 0)    zoom.x = 0;
    if (zoom.x < minX) zoom.x = minX;
    if (zoom.y > 0)    zoom.y = 0;
    if (zoom.y < minY) zoom.y = minY;
  }

  function resetZoom(animate) {
    zoom.scale = 1;
    zoom.x = 0;
    zoom.y = 0;
    zoom.isPanning = false;
    zoom.isPinching = false;
    applyTransform(animate !== false);
  }

  // Zoom to target scale, keeping the given client-space point fixed under finger/cursor.
  function zoomToPoint(targetScale, clientX, clientY, animate) {
    var wrap = getWrap();
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    // container-space point
    var cx = clientX - rect.left;
    var cy = clientY - rect.top;

    targetScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale));

    // keep cx,cy fixed: new_x = cx - (ratio)*(cx - old_x) where ratio = targetScale/oldScale
    var ratio = targetScale / zoom.scale;
    zoom.x = cx - ratio * (cx - zoom.x);
    zoom.y = cy - ratio * (cy - zoom.y);
    zoom.scale = targetScale;

    clampPan();
    applyTransform(!!animate);
  }

  // =============================================
  // DESKTOP ZOOM (click + mousemove pan + wheel)
  // =============================================
  function initDesktopZoom() {
    var wrap = getWrap();
    if (!wrap || isTouch) return;

    wrap.addEventListener('click', function (e) {
      if (zoom.scale > 1.02) {
        resetZoom(true);
      } else {
        zoomToPoint(2.5, e.clientX, e.clientY, true);
      }
    });

    wrap.addEventListener('mousemove', function (e) {
      if (zoom.scale <= 1.02) return;
      var rect = wrap.getBoundingClientRect();
      var fx = (e.clientX - rect.left) / rect.width;
      var fy = (e.clientY - rect.top) / rect.height;
      fx = Math.max(0, Math.min(1, fx));
      fy = Math.max(0, Math.min(1, fy));
      // pan so normalized fx,fy maps through image
      var cw = rect.width, ch = rect.height;
      zoom.x = -(cw * (zoom.scale - 1)) * fx;
      zoom.y = -(ch * (zoom.scale - 1)) * fy;
      applyTransform(false);
    });

    wrap.addEventListener('mouseleave', function () {
      if (zoom.scale > 1.02) resetZoom(true);
    });

    // Optional: wheel zoom
    wrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = -e.deltaY * 0.003;
      var newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoom.scale * (1 + delta)));
      zoomToPoint(newScale, e.clientX, e.clientY, false);
    }, { passive: false });
  }

  // =============================================
  // MOBILE TOUCH GESTURES
  // =============================================
  function getTouchDist(t1, t2) {
    var dx = t1.clientX - t2.clientX;
    var dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getTouchCenter(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  function initMobileTouch() {
    var wrap = getWrap();
    if (!wrap) return;

    wrap.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrap.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    wrap.addEventListener('touchend',   handleTouchEnd,   { passive: false });
    wrap.addEventListener('touchcancel', handleTouchEnd,  { passive: false });

    function handleTouchStart(e) {
      var hint = document.getElementById('lbZoomHint');
      if (hint) hint.classList.remove('lightbox__zoom-hint--show');

      // Cancel any animation in progress
      var img = getImg();
      if (img) img.style.transition = 'none';

      if (e.touches.length >= 2) {
        // PINCH START — always prevent default (stop page zoom)
        e.preventDefault();
        var t1 = e.touches[0], t2 = e.touches[1];
        zoom.isPinching = true;
        zoom.isPanning = false;
        zoom.pinchStartDist = getTouchDist(t1, t2);
        zoom.pinchStartScale = zoom.scale;
        var c = getTouchCenter(t1, t2);
        zoom.pinchCenterX = c.x;
        zoom.pinchCenterY = c.y;
        // Remember current translation so we can keep pinch center fixed
        zoom.pinchStartX = zoom.x;
        zoom.pinchStartY = zoom.y;
      } else if (e.touches.length === 1) {
        var now = Date.now();
        var t = e.touches[0];

        // DOUBLE TAP DETECTION
        if (now - zoom.lastTapTime < 320 &&
            Math.abs(t.clientX - zoom.lastTapX) < 40 &&
            Math.abs(t.clientY - zoom.lastTapY) < 40) {
          e.preventDefault();
          zoom.lastTapTime = 0;
          if (zoom.scale > 1.05) {
            resetZoom(true);
          } else {
            zoomToPoint(DOUBLE_TAP_SCALE, t.clientX, t.clientY, true);
          }
          return;
        }
        zoom.lastTapTime = now;
        zoom.lastTapX = t.clientX;
        zoom.lastTapY = t.clientY;

        // PAN / SWIPE start
        zoom.panStartFingerX = t.clientX;
        zoom.panStartFingerY = t.clientY;
        zoom.panStartX = zoom.x;
        zoom.panStartY = zoom.y;
        zoom.swipeStartX = t.clientX;
        zoom.swipeStartY = t.clientY;
        zoom.swipeStartTime = now;
        zoom.isPanning = true;

        // If zoomed, prevent default so browser doesn't scroll/back-nav
        if (zoom.scale > 1.02) e.preventDefault();
      }
    }

    function handleTouchMove(e) {
      if (e.touches.length >= 2 && zoom.isPinching) {
        e.preventDefault();
        var t1 = e.touches[0], t2 = e.touches[1];
        var dist = getTouchDist(t1, t2);
        if (zoom.pinchStartDist <= 0) return;

        var rawScale = zoom.pinchStartScale * (dist / zoom.pinchStartDist);
        // Allow some overshoot below 1 for rubber-band, clamp above
        var newScale = Math.max(0.6, Math.min(MAX_SCALE, rawScale));

        var c = getTouchCenter(t1, t2);
        var wrapRect = wrap.getBoundingClientRect();

        // Container-space pinch start center
        var cx0 = zoom.pinchCenterX - wrapRect.left;
        var cy0 = zoom.pinchCenterY - wrapRect.top;
        // Current container-space center (follow fingers → lets users move while pinching)
        var cx1 = c.x - wrapRect.left;
        var cy1 = c.y - wrapRect.top;

        // Keep the original pinch point (cx0,cy0) under its initial screen point, then translate by (cx1-cx0,cy1-cy0)
        var ratio = newScale / zoom.pinchStartScale;
        zoom.scale = newScale;
        zoom.x = cx0 - ratio * (cx0 - zoom.pinchStartX) + (cx1 - cx0);
        zoom.y = cy0 - ratio * (cy0 - zoom.pinchStartY) + (cy1 - cy0);

        // Light clamp during gesture — allow some slack
        applyTransform(false);
        return;
      }

      if (e.touches.length === 1 && zoom.isPanning && !zoom.isPinching) {
        var t = e.touches[0];
        var dx = t.clientX - zoom.panStartFingerX;
        var dy = t.clientY - zoom.panStartFingerY;

        if (zoom.scale > 1.02) {
          // PAN when zoomed
          e.preventDefault();
          zoom.x = zoom.panStartX + dx;
          zoom.y = zoom.panStartY + dy;
          // Allow slight overshoot during drag (no clamp yet — clamp on end)
          var wrap2 = wrap;
          var cw = wrap2.clientWidth, ch = wrap2.clientHeight;
          var s = zoom.scale;
          var minX = cw * (1 - s), minY = ch * (1 - s);
          var slack = 60;
          if (zoom.x > slack) zoom.x = slack;
          if (zoom.x < minX - slack) zoom.x = minX - slack;
          if (zoom.y > slack) zoom.y = slack;
          if (zoom.y < minY - slack) zoom.y = minY - slack;
          applyTransform(false);
        }
        // else: don't prevent default — browser won't scroll because touch-action:none, but allow swipe detect on end
      }
    }

    function handleTouchEnd(e) {
      if (e.touches.length === 0) {
        // Finished all gestures
        if (zoom.isPinching) {
          zoom.isPinching = false;
          // Snap back to 1 if rubber-banded below
          if (zoom.scale < 1) {
            resetZoom(true);
          } else {
            clampPan();
            applyTransform(true);
          }
          zoom.isPanning = false;
          return;
        }

        // SWIPE detection (only when not zoomed and was panning)
        if (zoom.scale <= 1.02 && zoom.isPanning) {
          var elapsed = Date.now() - zoom.swipeStartTime;
          var ct = e.changedTouches[0];
          if (ct) {
            var dx = ct.clientX - zoom.swipeStartX;
            var dy = ct.clientY - zoom.swipeStartY;
            var ax = Math.abs(dx), ay = Math.abs(dy);
            if (ax > 50 && ax > ay * 1.2 && elapsed < 500) {
              if (dx < 0) nextImage(); else prevImage();
              zoom.isPanning = false;
              return;
            }
          }
        }

        // Clamp pan after drag ends (animated)
        if (zoom.scale > 1.02) {
          clampPan();
          applyTransform(true);
        }
        zoom.isPanning = false;
        return;
      }

      // Went from 2 touches to 1 — end pinch, start pan from the remaining finger
      if (e.touches.length === 1 && zoom.isPinching) {
        zoom.isPinching = false;
        clampPan();
        applyTransform(false);
        var remaining = e.touches[0];
        zoom.panStartFingerX = remaining.clientX;
        zoom.panStartFingerY = remaining.clientY;
        zoom.panStartX = zoom.x;
        zoom.panStartY = zoom.y;
        zoom.swipeStartX = remaining.clientX;
        zoom.swipeStartY = remaining.clientY;
        zoom.swipeStartTime = Date.now();
        zoom.isPanning = zoom.scale > 1.02; // only pan if zoomed
      }
    }
  }

  // =============================================
  // RENDER
  // =============================================
  function renderLightbox() {
    var p = products[currentProductIndex];
    if (!p) return;
    var imgs = p.images;

    resetZoom();

    // Main image
    var img = document.getElementById('lbImg');
    img.src = imgs[currentImageIndex];
    img.alt = p.name;

    // Info
    document.getElementById('lbCondition').textContent = p.condition;
    document.getElementById('lbName').textContent = p.name;

    // Enquiry-only pieces are sold in conversation. Showing a dollar figure here
    // — and an Add to Cart button under it — undoes the whole point of the card
    // grid hiding the price, so the lightbox has to hide it too.
    var priceEl = document.getElementById('lbPrice');
    var cartBtn = document.getElementById('lbAddToCart');
    if (p.enquiryOnly) {
      priceEl.textContent = 'Enquire for price';
      priceEl.classList.add('lightbox__price--enquire');
      cartBtn.textContent = 'Enquire';
    } else {
      priceEl.textContent = '$' + p.price.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
      priceEl.classList.remove('lightbox__price--enquire');
      cartBtn.innerHTML = 'Add to Cart'
        + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    document.getElementById('lbProdCounter').textContent = (currentProductIndex + 1) + ' / ' + products.length;

    // Image counter (mobile)
    var counter = document.getElementById('lbCounter');
    if (counter) {
      counter.textContent = (currentImageIndex + 1) + ' / ' + imgs.length;
      counter.style.display = imgs.length > 1 ? '' : 'none';
    }

    // Show/hide image arrows
    var showArrows = imgs.length > 1;
    document.getElementById('lbImgPrev').style.display = showArrows ? 'flex' : 'none';
    document.getElementById('lbImgNext').style.display = showArrows ? 'flex' : 'none';

    // Zoom hint text
    var zoomText = document.getElementById('lbZoomText');
    if (zoomText) {
      zoomText.textContent = isTouch ? 'Pinch or double-tap to zoom' : 'Click to zoom';
    }

    renderThumbs(imgs);
  }

  function renderThumbs(imgs) {
    var container = document.getElementById('lbThumbs');
    if (imgs.length <= 1) {
      container.innerHTML = '';
      return;
    }
    var html = '';
    imgs.forEach(function (src, i) {
      html += '<button class="lightbox__thumb' + (i === currentImageIndex ? ' lightbox__thumb--active' : '') + '" data-index="' + i + '">';
      html += '<img src="' + src + '" alt="View ' + (i + 1) + '">';
      html += '</button>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.lightbox__thumb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentImageIndex = parseInt(this.getAttribute('data-index'));
        renderLightbox();
      });
    });
  }

  function prevImage() {
    var imgs = products[currentProductIndex].images;
    currentImageIndex = (currentImageIndex - 1 + imgs.length) % imgs.length;
    renderLightbox();
  }

  function nextImage() {
    var imgs = products[currentProductIndex].images;
    currentImageIndex = (currentImageIndex + 1) % imgs.length;
    renderLightbox();
  }

  function prevProduct() {
    currentProductIndex = (currentProductIndex - 1 + products.length) % products.length;
    currentImageIndex = 0;
    renderLightbox();
  }

  function nextProduct() {
    currentProductIndex = (currentProductIndex + 1) % products.length;
    currentImageIndex = 0;
    renderLightbox();
  }

  function initClickHandlers() {
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card, i) {
      var imgWrap = card.querySelector('.product-card__image');
      if (!imgWrap) return;
      imgWrap.style.cursor = 'zoom-in';

      // Zoom hint icon on card
      var hint = document.createElement('div');
      hint.className = 'product-card__zoom-hint';
      hint.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';
      imgWrap.appendChild(hint);

      // On mobile, also show the hint always
      if (isMobile) hint.classList.add('product-card__zoom-hint--mobile');

      imgWrap.addEventListener('click', function (e) {
        // Both buttons live inside the image overlay — a tap on either is a tap on
        // the button, not a request to zoom the card.
        if (e.target.closest('.btn-add-to-cart, [data-enquire]')) return;
        openLightbox(i);
      });
    });

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbBackdrop').addEventListener('click', function () {
      if (zoom.scale <= 1.05) closeLightbox();
    });
    document.getElementById('lbImgPrev').addEventListener('click', function (e) {
      e.stopPropagation();
      prevImage();
    });
    document.getElementById('lbImgNext').addEventListener('click', function (e) {
      e.stopPropagation();
      nextImage();
    });
    document.getElementById('lbProdPrev').addEventListener('click', prevProduct);
    document.getElementById('lbProdNext').addEventListener('click', nextProduct);

    document.getElementById('lbAddToCart').addEventListener('click', function () {
      var p = products[currentProductIndex];
      if (!p) return;

      // Enquiry-only: close the lightbox and hand off to the card's own Enquire
      // button, so the buyer lands on the contact form with the card already
      // named. Reuses the delegated handler in main.js rather than repeating it.
      if (p.enquiryOnly) {
        closeLightbox();
        var card = document.querySelector('.product-card[data-product-id="' + p.id + '"]');
        var enquireBtn = card && card.querySelector('[data-enquire]');
        if (enquireBtn) enquireBtn.click();
        return;
      }

      if (window.HEFCart) {
        window.HEFCart.add({
          id:        p.id,
          name:      p.name,
          price:     p.price,
          condition: p.condition,
          image:     p.images[0]
        });
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!document.getElementById('lightbox').classList.contains('lightbox--open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  prevImage();
      if (e.key === 'ArrowRight') nextImage();
    });
  }

  function init() {
    buildProductList();
    if (products.length === 0) return;
    createLightbox();
    initClickHandlers();

    if (isTouch) {
      initMobileTouch();
    } else {
      initDesktopZoom();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

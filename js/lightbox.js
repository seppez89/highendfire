/* ============================================
   HIGH END FIRE — Lightbox Image Viewer
   Multi-image per product with thumbnail strip
   ============================================ */

(function () {
  'use strict';

  // --- Per-product image galleries ---
  var PRODUCT_IMAGES = {
    'db-energy-marker-e81': [
      'images/products/db-energy-marker-e81-1.jpg',
      'images/products/db-energy-marker-e81-2.jpg',
      'images/products/db-energy-marker-e81-3.jpg',
      'images/products/db-energy-marker-e81-4.jpg'
    ],
    'mewtwo-ex-125-glory': [
      'images/products/mewtwo-ex-125-glory-1.jpg',
      'images/products/mewtwo-ex-125-glory-2.jpg'
    ],
    'mew-ex-232': [
      'images/products/mew-ex-232-1.jpg',
      'images/products/mew-ex-232-3.jpg'
    ],
    'mewtwo-ex-240-destined': [
      'images/products/mewtwo-ex-240-destined-1.jpg',
      'images/products/mewtwo-ex-240-destined-2.jpg'
    ],
    'lillie-sar-091': [
      'images/products/lillie-sar-091-1.jpg',
      'images/products/lillie-sar-091-2.jpg'
    ],
    'cynthia-sv82-hidden-fates': [
      'images/products/cynthia-sv82-hidden-fates-1.jpg',
      'images/products/cynthia-sv82-hidden-fates-2.jpg'
    ],
    'op-romance-dawn-blue': [
      'images/products/op-romance-dawn-blue-1.jpg',
      'images/products/op-romance-dawn-blue-2.jpg',
      'images/products/op-romance-dawn-blue-3.jpg',
      'images/products/op-romance-dawn-blue-4.jpg',
      'images/products/op-romance-dawn-blue-5.jpg',
      'images/products/op-romance-dawn-blue-6.jpg'
    ],
    'fossil-set-1st-ed': [
      'images/products/fossil-set-1st-ed-1.jpg',
      'images/products/fossil-set-1st-ed-2.jpg',
      'images/products/fossil-set-1st-ed-3.jpg',
      'images/products/fossil-set-1st-ed-4.jpg',
      'images/products/fossil-set-1st-ed-5.jpg',
      'images/products/fossil-set-1st-ed-6.jpg',
      'images/products/fossil-set-1st-ed-7.jpg',
      'images/products/fossil-set-1st-ed-8.jpg',
      'images/products/fossil-set-1st-ed-9.jpg',
      'images/products/fossil-set-1st-ed-10.jpg'
    ],
    'articuno-fossil-holo': [
      'images/products/articuno-fossil-holo-1.jpg',
      'images/products/articuno-fossil-holo-2.jpg'
    ],
    'dragonite-fossil-holo': [
      'images/products/dragonite-fossil-holo-1.jpg',
      'images/products/dragonite-fossil-holo-2.jpg'
    ]
  };

  var products = [];
  var currentProductIndex = 0;
  var currentImageIndex = 0;

  function buildProductList() {
    products = [];
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      products.push({
        id:        id,
        name:      card.getAttribute('data-product-name') || '',
        condition: card.getAttribute('data-product-condition') || '',
        price:     parseFloat(card.getAttribute('data-product-price')) || 0,
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
      '    <div class="lightbox__main-image">',
      '      <img id="lbImg" src="" alt="" class="lightbox__img">',
      '    </div>',
      '    <button class="lightbox__arrow lightbox__arrow--next" id="lbImgNext" aria-label="Next image">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
      '    </button>',
      '    <!-- Thumbnail strip -->',
      '    <div class="lightbox__thumbs" id="lbThumbs"></div>',
      '  </div>',

      '  <!-- Right: product info -->',
      '  <div class="lightbox__right">',
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
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  function renderLightbox() {
    var p = products[currentProductIndex];
    if (!p) return;

    var imgs = p.images;

    // Main image
    var img = document.getElementById('lbImg');
    img.src = imgs[currentImageIndex];
    img.alt = p.name;

    // Info
    document.getElementById('lbCondition').textContent = p.condition;
    document.getElementById('lbName').textContent = p.name;
    document.getElementById('lbPrice').textContent = '$' + p.price.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
    document.getElementById('lbProdCounter').textContent = (currentProductIndex + 1) + ' / ' + products.length;

    // Show/hide image arrows
    var showArrows = imgs.length > 1;
    document.getElementById('lbImgPrev').style.display = showArrows ? 'flex' : 'none';
    document.getElementById('lbImgNext').style.display = showArrows ? 'flex' : 'none';

    // Thumbnails
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

      // Zoom hint icon
      var hint = document.createElement('div');
      hint.className = 'product-card__zoom-hint';
      hint.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';
      imgWrap.appendChild(hint);

      imgWrap.addEventListener('click', function (e) {
        if (e.target.closest('.btn-add-to-cart')) return;
        openLightbox(i);
      });
    });

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbBackdrop').addEventListener('click', closeLightbox);
    document.getElementById('lbImgPrev').addEventListener('click', prevImage);
    document.getElementById('lbImgNext').addEventListener('click', nextImage);
    document.getElementById('lbProdPrev').addEventListener('click', prevProduct);
    document.getElementById('lbProdNext').addEventListener('click', nextProduct);

    document.getElementById('lbAddToCart').addEventListener('click', function () {
      var p = products[currentProductIndex];
      if (p && window.HEFCart) {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

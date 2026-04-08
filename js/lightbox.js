/* ============================================
   HIGH END FIRE — Lightbox Image Viewer
   ============================================ */

(function () {
  'use strict';

  var products = [];
  var currentIndex = 0;

  function buildProductList() {
    products = [];
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card) {
      var img = card.querySelector('.product-card__image img');
      if (!img) return;
      products.push({
        image:     card.getAttribute('data-product-image') || img.src,
        name:      card.getAttribute('data-product-name') || '',
        condition: card.getAttribute('data-product-condition') || '',
        price:     parseFloat(card.getAttribute('data-product-price')) || 0,
        id:        card.getAttribute('data-product-id')
      });
    });
  }

  function createLightbox() {
    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = [
      '<div class="lightbox__backdrop" id="lbBackdrop"></div>',
      '<div class="lightbox__container">',
      '  <button class="lightbox__close" id="lbClose" aria-label="Close">&times;</button>',
      '  <button class="lightbox__nav lightbox__nav--prev" id="lbPrev" aria-label="Previous">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
      '  </button>',
      '  <div class="lightbox__content">',
      '    <div class="lightbox__image-wrap">',
      '      <img class="lightbox__img" id="lbImg" src="" alt="">',
      '    </div>',
      '    <div class="lightbox__info">',
      '      <span class="lightbox__condition" id="lbCondition"></span>',
      '      <h3 class="lightbox__name" id="lbName"></h3>',
      '      <div class="lightbox__footer">',
      '        <span class="lightbox__price" id="lbPrice"></span>',
      '        <button class="btn btn--primary btn--sm lb-add-to-cart" id="lbAddToCart">',
      '          Add to Cart',
      '          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      '        </button>',
      '      </div>',
      '      <div class="lightbox__counter" id="lbCounter"></div>',
      '    </div>',
      '  </div>',
      '  <button class="lightbox__nav lightbox__nav--next" id="lbNext" aria-label="Next">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
      '  </button>',
      '</div>'
    ].join('\n');
    document.body.appendChild(lb);
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    var lb = document.getElementById('lightbox');
    lb.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    lb.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    var p = products[currentIndex];
    if (!p) return;

    var img       = document.getElementById('lbImg');
    var name      = document.getElementById('lbName');
    var condition = document.getElementById('lbCondition');
    var price     = document.getElementById('lbPrice');
    var counter   = document.getElementById('lbCounter');
    var atcBtn    = document.getElementById('lbAddToCart');

    img.src = p.image.replace('/w_500,h_500', '/w_1200,h_1200');
    img.alt = p.name;
    name.textContent = p.name;
    condition.textContent = p.condition;
    price.textContent = '$' + p.price.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
    counter.textContent = (currentIndex + 1) + ' / ' + products.length;
    atcBtn.setAttribute('data-product-index', currentIndex);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + products.length) % products.length;
    updateLightbox();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % products.length;
    updateLightbox();
  }

  function initClickHandlers() {
    // Click on product image to open lightbox
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card, i) {
      var imgWrap = card.querySelector('.product-card__image');
      if (!imgWrap) return;
      imgWrap.style.cursor = 'zoom-in';

      // Add zoom icon hint
      var zoomHint = document.createElement('div');
      zoomHint.className = 'product-card__zoom-hint';
      zoomHint.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';
      imgWrap.appendChild(zoomHint);

      imgWrap.addEventListener('click', function (e) {
        // Don't open lightbox if Add to Cart was clicked
        if (e.target.closest('.btn-add-to-cart')) return;
        openLightbox(i);
      });
    });

    // Lightbox controls
    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbBackdrop').addEventListener('click', closeLightbox);
    document.getElementById('lbPrev').addEventListener('click', showPrev);
    document.getElementById('lbNext').addEventListener('click', showNext);

    // Add to cart from lightbox
    document.getElementById('lbAddToCart').addEventListener('click', function () {
      var p = products[currentIndex];
      if (p && window.HEFCart) {
        window.HEFCart.add(p);
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      var lb = document.getElementById('lightbox');
      if (!lb.classList.contains('lightbox--open')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   showPrev();
      if (e.key === 'ArrowRight')  showNext();
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

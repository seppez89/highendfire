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
  // ZOOM & PAN STATE
  // =============================================
  var zoom = {
    active: false,
    scale: 1,
    minScale: 1,
    maxScale: 4,
    x: 0,
    y: 0,
    // For pinch gesture tracking
    startDist: 0,
    startScale: 1,
    // For pan tracking
    panStartX: 0,
    panStartY: 0,
    startX: 0,
    startY: 0,
    isPanning: false,
    // For swipe detection
    swipeStartX: 0,
    swipeStartY: 0,
    swipeStartTime: 0,
    // Double tap
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    // Animation
    animFrame: null
  };

  function getWrap() { return document.getElementById('lbMainImage'); }
  function getImg() { return document.getElementById('lbImg'); }

  function applyTransform(animate) {
    var img = getImg();
    if (!img) return;
    var transition = animate ? 'transform 0.3s cubic-bezier(.25,.46,.45,.94)' : 'none';
    img.style.transition = transition;
    img.style.transform = 'translate(' + zoom.x + 'px, ' + zoom.y + 'px) scale(' + zoom.scale + ')';
    img.style.transformOrigin = '0 0';

    var wrap = getWrap();
    if (wrap) {
      var isZoomed = zoom.scale > 1.05;
      wrap.classList.toggle('is-zoomed', isZoomed);
      // Also toggle parent for hiding arrows/thumbnails on mobile
      var left = wrap.parentElement;
      if (left) left.classList.toggle('is-zoomed-parent', isZoomed);
    }
  }

  function clampPan() {
    var wrap = getWrap();
    var img = getImg();
    if (!wrap || !img) return;

    var wRect = wrap.getBoundingClientRect();
    var imgW = img.naturalWidth;
    var imgH = img.naturalHeight;

    // Fit dimensions
    var fitScale = Math.min(wRect.width / imgW, wRect.height / imgH);
    var dispW = imgW * fitScale * zoom.scale;
    var dispH = imgH * fitScale * zoom.scale;

    // Center offset
    var offsetX = (wRect.width - imgW * fitScale) / 2;
    var offsetY = (wRect.height - imgH * fitScale) / 2;

    if (dispW <= wRect.width) {
      zoom.x = offsetX * (1 - zoom.scale) / 1;
      // Re-center
      zoom.x = (wRect.width - dispW) / 2;
    } else {
      var minX = wRect.width - dispW;
      var maxX = 0;
      zoom.x = Math.max(minX, Math.min(maxX, zoom.x));
    }

    if (dispH <= wRect.height) {
      zoom.y = (wRect.height - dispH) / 2;
    } else {
      var minY = wRect.height - dispH;
      var maxY = 0;
      zoom.y = Math.max(minY, Math.min(maxY, zoom.y));
    }
  }

  function resetZoom() {
    zoom.active = false;
    zoom.scale = 1;
    zoom.x = 0;
    zoom.y = 0;
    zoom.isPanning = false;
    var img = getImg();
    var wrap = getWrap();
    if (img) {
      img.style.transition = 'transform 0.3s cubic-bezier(.25,.46,.45,.94)';
      img.style.transform = 'translate(0,0) scale(1)';
      img.style.transformOrigin = '0 0';
    }
    if (wrap) {
      wrap.classList.remove('is-zoomed');
      var left = wrap.parentElement;
      if (left) left.classList.remove('is-zoomed-parent');
    }
  }

  function zoomToPoint(targetScale, px, py, animate) {
    var wrap = getWrap();
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();

    // Point in container space
    var cx = px - rect.left;
    var cy = py - rect.top;

    // Adjust translation so the point under finger stays fixed
    var ratio = targetScale / zoom.scale;
    zoom.x = cx - ratio * (cx - zoom.x);
    zoom.y = cy - ratio * (cy - zoom.y);
    zoom.scale = targetScale;

    // Clamp
    zoom.scale = Math.max(zoom.minScale, Math.min(zoom.maxScale, zoom.scale));
    clampPan();
    applyTransform(animate);
    zoom.active = zoom.scale > 1.05;
  }

  // =============================================
  // DESKTOP ZOOM (click + mousemove)
  // =============================================
  function initDesktopZoom() {
    var wrap = getWrap();
    if (!wrap || isTouch) return;

    wrap.addEventListener('click', function (e) {
      if (zoom.scale > 1.05) {
        resetZoom();
      } else {
        // Zoom to 2.5x at click point
        zoomToPoint(2.5, e.clientX, e.clientY, true);
      }
    });

    wrap.addEventListener('mousemove', function (e) {
      if (zoom.scale <= 1.05) return;
      var rect = wrap.getBoundingClientRect();
      var fx = (e.clientX - rect.left) / rect.width;
      var fy = (e.clientY - rect.top) / rect.height;
      fx = Math.max(0, Math.min(1, fx));
      fy = Math.max(0, Math.min(1, fy));

      var img = getImg();
      if (!img) return;
      var fitScale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
      var dispW = img.naturalWidth * fitScale * zoom.scale;
      var dispH = img.naturalHeight * fitScale * zoom.scale;

      if (dispW > rect.width) {
        zoom.x = -(dispW - rect.width) * fx;
      }
      if (dispH > rect.height) {
        zoom.y = -(dispH - rect.height) * fy;
      }
      applyTransform(false);
    });

    wrap.addEventListener('mouseleave', function () {
      if (zoom.scale > 1.05) resetZoom();
    });
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
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function initMobileTouch() {
    var wrap = getWrap();
    if (!wrap) return;

    // Prevent browser default pinch/zoom on the lightbox
    wrap.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrap.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrap.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    function handleTouchStart(e) {
      // Hide zoom hint
      var hint = document.getElementById('lbZoomHint');
      if (hint) hint.classList.remove('lightbox__zoom-hint--show');

      if (e.touches.length === 2) {
        // PINCH START
        e.preventDefault();
        zoom.startDist = getTouchDist(e.touches[0], e.touches[1]);
        zoom.startScale = zoom.scale;
        zoom.isPanning = false;
      } else if (e.touches.length === 1) {
        var now = Date.now();
        var t = e.touches[0];

        // DOUBLE TAP DETECTION
        if (now - zoom.lastTapTime < 300 &&
            Math.abs(t.clientX - zoom.lastTapX) < 30 &&
            Math.abs(t.clientY - zoom.lastTapY) < 30) {
          e.preventDefault();
          zoom.lastTapTime = 0;
          if (zoom.scale > 1.05) {
            resetZoom();
          } else {
            zoomToPoint(2.5, t.clientX, t.clientY, true);
          }
          return;
        }

        zoom.lastTapTime = now;
        zoom.lastTapX = t.clientX;
        zoom.lastTapY = t.clientY;

        // PAN or SWIPE start
        zoom.panStartX = t.clientX;
        zoom.panStartY = t.clientY;
        zoom.startX = zoom.x;
        zoom.startY = zoom.y;
        zoom.swipeStartX = t.clientX;
        zoom.swipeStartY = t.clientY;
        zoom.swipeStartTime = now;
        zoom.isPanning = true;

        // Cancel any ongoing transition for responsive feel
        var img = getImg();
        if (img) img.style.transition = 'none';
      }
    }

    function handleTouchMove(e) {
      if (e.touches.length === 2) {
        // PINCH ZOOM
        e.preventDefault();
        var dist = getTouchDist(e.touches[0], e.touches[1]);
        var newScale = zoom.startScale * (dist / zoom.startDist);
        var center = getTouchCenter(e.touches[0], e.touches[1]);
        zoomToPoint(newScale, center.x, center.y, false);
      } else if (e.touches.length === 1 && zoom.isPanning) {
        var t = e.touches[0];
        var dx = t.clientX - zoom.panStartX;
        var dy = t.clientY - zoom.panStartY;

        if (zoom.scale > 1.05) {
          // PAN when zoomed
          e.preventDefault();
          zoom.x = zoom.startX + dx;
          zoom.y = zoom.startY + dy;
          clampPan();
          applyTransform(false);
        }
        // If not zoomed, don't preventDefault — allow natural swipe to be detected in touchEnd
      }
    }

    function handleTouchEnd(e) {
      if (e.touches.length === 0) {
        // SNAP back if below min scale
        if (zoom.scale < 1) {
          resetZoom();
          return;
        }

        // SWIPE detection (only when not zoomed)
        if (zoom.scale <= 1.05 && zoom.isPanning) {
          var elapsed = Date.now() - zoom.swipeStartTime;
          var changedTouch = e.changedTouches[0];
          if (changedTouch) {
            var dx = changedTouch.clientX - zoom.swipeStartX;
            var dy = changedTouch.clientY - zoom.swipeStartY;
            var absDx = Math.abs(dx);
            var absDy = Math.abs(dy);

            // Horizontal swipe: fast enough, far enough, more horizontal than vertical
            if (absDx > 40 && absDx > absDy * 1.2 && elapsed < 400) {
              if (dx < 0) {
                nextImage(); // swipe left = next
              } else {
                prevImage(); // swipe right = prev
              }
              zoom.isPanning = false;
              return;
            }
          }
        }

        // Clamp pan after pinch ends
        if (zoom.scale > 1.05) {
          clampPan();
          applyTransform(true);
        }

        zoom.isPanning = false;
      }

      // If one finger remains after a two-finger pinch, reset pan origin
      if (e.touches.length === 1) {
        zoom.panStartX = e.touches[0].clientX;
        zoom.panStartY = e.touches[0].clientY;
        zoom.startX = zoom.x;
        zoom.startY = zoom.y;
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
    document.getElementById('lbPrice').textContent = '$' + p.price.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
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
        if (e.target.closest('.btn-add-to-cart')) return;
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

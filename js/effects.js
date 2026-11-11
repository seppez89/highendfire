/* ============================================
   HIGH END FIRE — motion + glow
   A few big effects instead of many small ones:
     - embers rising behind the hero (one canvas)
     - the hero card fan leaning toward the pointer / the phone's tilt
     - a warm glow that follows the cursor; a bloom where a finger lands
     - product cards tilting under the pointer
     - sparks off Add to Cart, prices counting up
   Everything plays on load, on view or on touch. Nothing is tied to how far
   the page has been scrolled. All of it is skipped under "reduce motion".
   Reveal-on-view lives in main.js so pages without this file still get it.
   ============================================ */

(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // --- Product page: "View all photos" opens the existing lightbox ---
  var galleryBtn = document.querySelector('[data-open-gallery]');
  if (galleryBtn) {
    galleryBtn.addEventListener('click', function () {
      var img = document.querySelector('.product-stage .product-card__image');
      if (img) img.click();
    });
  }

  if (reduce) return;

  // --- Cursor glow (desktop) ---
  // One fixed element, moved with a transform, only while the pointer moves.
  if (fine) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var gx = 0, gy = 0, tx = 0, ty = 0, running = false, idle;
    var step = function () {
      gx += (tx - gx) * 0.16;
      gy += (ty - gy) * 0.16;
      glow.style.transform = 'translate3d(' + (gx - 260) + 'px,' + (gy - 260) + 'px,0)';
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) requestAnimationFrame(step);
      else running = false;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!glow.classList.contains('is-on')) { gx = tx; gy = ty; glow.classList.add('is-on'); }
      // The glow gathers and warms over things you can press.
      glow.classList.toggle('is-hot', !!(e.target.closest && e.target.closest('a, button, .product-card')));
      if (!running) { running = true; requestAnimationFrame(step); }
      clearTimeout(idle);
      idle = setTimeout(function () { glow.classList.remove('is-on'); }, 2600);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { glow.classList.remove('is-on'); });
  }

  // --- Touch bloom (phones) ---
  // A soft ember where the finger lands. CSS does the animation.
  if (!fine) {
    document.addEventListener('touchstart', function (e) {
      var t = e.touches && e.touches[0];
      if (!t) return;
      var b = document.createElement('span');
      b.className = 'touch-bloom';
      b.style.left = t.clientX + 'px';
      b.style.top = t.clientY + 'px';
      document.body.appendChild(b);
      b.addEventListener('animationend', function () { b.remove(); });
    }, { passive: true });
  }

  // --- Embers (hero) ---
  var canvas = document.querySelector('[data-embers]');
  if (canvas && canvas.getContext) {
    (function () {
      var ctx = canvas.getContext('2d');
      var host = canvas.parentElement;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = 0, h = 0, embers = [], raf = null, onScreen = true, last = 0;
      var count = fine ? 46 : 24;

      function size() {
        var r = host.getBoundingClientRect();
        // Ignore the height-only resizes a phone's address bar causes.
        if (Math.round(r.width) === w && Math.abs(r.height - h) < 120) return;
        w = Math.round(r.width); h = Math.round(r.height);
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function spawn(e, anywhere) {
        e.x = Math.random() * w;
        e.y = anywhere ? Math.random() * h : h + 10;
        e.r = 0.6 + Math.random() * 1.9;
        e.vy = 14 + Math.random() * 38;          // px per second, upward
        e.sway = 8 + Math.random() * 22;
        e.phase = Math.random() * 6.28;
        e.life = 0;
        e.max = 5 + Math.random() * 7;
        e.hot = Math.random() < 0.3;
        return e;
      }
      function frame(now) {
        raf = null;
        if (!onScreen || document.hidden) return;
        var dt = Math.min((now - last) / 1000, 0.05) || 0.016;
        last = now;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < embers.length; i++) {
          var e = embers[i];
          e.life += dt;
          e.y -= e.vy * dt;
          var x = e.x + Math.sin(e.phase + e.life * 0.9) * e.sway;
          var t = e.life / e.max;
          if (t >= 1 || e.y < -12) { spawn(e, false); continue; }
          var a = Math.sin(Math.min(t, 1) * Math.PI) * (e.hot ? 0.95 : 0.6);
          var g = ctx.createRadialGradient(x, e.y, 0, x, e.y, e.r * 5);
          g.addColorStop(0, 'rgba(255,' + (e.hot ? 190 : 140) + ',90,' + a + ')');
          g.addColorStop(0.35, 'rgba(224,92,42,' + a * 0.45 + ')');
          g.addColorStop(1, 'rgba(224,92,42,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, e.y, e.r * 5, 0, 6.2832);
          ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

      size();
      for (var i = 0; i < count; i++) embers.push(spawn({}, true));
      window.addEventListener('resize', size, { passive: true });
      document.addEventListener('visibilitychange', start);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          onScreen = en[0].isIntersecting;
          if (onScreen) start();
        }).observe(host);
      }
      start();
    })();
  }

  // --- Hero card fan leans toward the pointer, or with the phone ---
  var stage = document.querySelector('[data-stage]');
  if (stage) {
    var lean = function (nx, ny) {       // both -1..1
      stage.style.setProperty('--ry', (nx * 9).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-ny * 6).toFixed(2) + 'deg');
    };
    if (fine) {
      var hero = stage.closest('.hero') || stage;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        lean(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { lean(0, 0); });
    } else if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      // Only where the browser offers tilt without a permission prompt.
      var pending = false;
      window.addEventListener('deviceorientation', function (e) {
        if (pending || e.gamma == null) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          lean(Math.max(-1, Math.min(1, e.gamma / 28)), Math.max(-1, Math.min(1, (e.beta - 45) / 32)));
        });
      }, { passive: true });
    }
  }

  // --- Product cards tilt under the pointer (desktop only) ---
  if (fine) {
    var tilted = null;
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.tilt-3d');
      if (card && card.closest('.product-stage')) card = null;   // the big product-page card stays flat
      if (tilted && tilted !== card) { tilted.style.transform = ''; tilted = null; }
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' +
        (px * 6).toFixed(2) + 'deg) translateY(-6px)';
      card.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
      tilted = card;
    }, { passive: true });
    document.addEventListener('mouseleave', function () {
      if (tilted) { tilted.style.transform = ''; tilted = null; }
    });
  }

  // --- Sparks off Add to Cart ---
  // Capture phase: cart.js stops the click from bubbling.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.btn-add-to-cart');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 12; i++) {
      var s = document.createElement('span');
      var ang = (i / 12) * 6.2832 + Math.random() * 0.5;
      var dist = 34 + Math.random() * 46;
      s.className = 'spark';
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist - 18).toFixed(1) + 'px');
      document.body.appendChild(s);
      s.addEventListener('animationend', function () { this.remove(); });
    }
  }, true);

  // --- Prices count up once, on the featured row and the product page ---
  var prices = document.querySelectorAll(
    '.products-grid--featured .product-card__price.price-shimmer, .product-stage .product-card__price.price-shimmer');
  if (prices.length && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        pio.unobserve(en.target);
        var span = en.target;
        var node = span.firstChild;
        var card = span.closest('.product-card');
        var target = card ? parseFloat(card.getAttribute('data-product-price')) : NaN;
        // Only the plain "$1,400<small>.00 AUD</small>" shape; sale prices nest more.
        if (!node || node.nodeType !== 3 || !isFinite(target) || !/^\s*\$[\d,]+\s*$/.test(node.nodeValue)) return;
        var final = node.nodeValue, t0 = performance.now(), dur = 750;
        (function tick(now) {
          var k = Math.min((now - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          node.nodeValue = k < 1 ? '$' + Math.round(target * eased).toLocaleString('en-AU') : final;
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(prices, function (p) { pio.observe(p); });
  }
})();

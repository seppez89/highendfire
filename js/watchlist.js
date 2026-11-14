// High End Fire — First dibs email signup.
// 1. Every [data-watchlist-form] posts to /api/subscribe (Brevo) as JSON.
// 2. On pages that have one (the homepage), the exit-intent popup.
// Loaded on every page that carries a signup form. Safe to load twice.
(function () {
  'use strict';

  var BUTTON_TEXT = 'Get first dibs';

  // --- Signup forms (AJAX via /api/subscribe → Brevo) ---
  document.querySelectorAll('[data-watchlist-form]').forEach(function (form) {
    if (form.hasAttribute('data-bound')) return;
    form.setAttribute('data-bound', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var fineprint = form.parentElement.querySelector('[data-watchlist-fineprint]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      // JSON, not FormData — the serverless runtime parses JSON and urlencoded
      // bodies but leaves multipart/form-data unparsed, so req.body would be empty.
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error((data && data.error) || 'http ' + r.status);
            return data;
          });
        })
        .then(function (data) {
          if (data && (data.success === 'true' || data.success === true)) {
            form.innerHTML = '<p class="watchlist-success">You\'re in. You\'ll hear about new stock first.</p>';
            if (fineprint) fineprint.textContent = '';
          } else {
            throw new Error('failed');
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = BUTTON_TEXT; }
          var err = form.querySelector('.watchlist-error');
          if (!err) {
            err = document.createElement('p');
            err.className = 'watchlist-error';
            err.textContent = 'That didn\'t go through. Try again, or text 0404 311 791.';
            form.appendChild(err);
          }
        });
    });
  });

  // --- Exit-intent popup ---
  var STORAGE_KEY = 'hef_watchlist_dismissed_at';
  var SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;
  var MOBILE_MIN_DEPTH = 800;
  var MOBILE_UP_DELTA = 250;
  var MOBILE_UP_WINDOW_MS = 800;

  var popup = document.getElementById('exitPopup');
  if (!popup || popup.hasAttribute('data-bound')) return;
  popup.setAttribute('data-bound', '');

  var emailInput = popup.querySelector('#exitPopupEmail');
  var form = popup.querySelector('form');
  var shownThisSession = false;

  function isSuppressed() {
    try {
      var t = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return t && (Date.now() - t) < SUPPRESS_MS;
    } catch (e) { return false; }
  }

  function markDismissed() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
  }

  function cartOpen() {
    return !!document.querySelector('.cart-drawer--open');
  }

  function show() {
    if (shownThisSession || isSuppressed() || cartOpen()) return;
    shownThisSession = true;
    popup.hidden = false;
    // next frame so the transition plays
    requestAnimationFrame(function () {
      popup.setAttribute('aria-hidden', 'false');
      if (emailInput) {
        try { emailInput.focus({ preventScroll: true }); } catch (e) { emailInput.focus(); }
      }
    });
  }

  function hide() {
    popup.setAttribute('aria-hidden', 'true');
    markDismissed();
    setTimeout(function () { popup.hidden = true; }, 250);
  }

  // Close handlers
  popup.querySelectorAll('[data-popup-close]').forEach(function (el) {
    el.addEventListener('click', hide);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.getAttribute('aria-hidden') === 'false') hide();
  });
  if (form) {
    form.addEventListener('submit', function () { markDismissed(); });
  }

  // Desktop: mouseout toward top of viewport
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) {
    document.addEventListener('mouseout', function (e) {
      if (e.clientY <= 0 && !e.relatedTarget && !e.toElement) show();
    });
  } else {
    // Mobile: rapid upward scroll after engagement
    var lastY = window.scrollY;
    var maxY = lastY;
    var upAccum = 0;
    var upStart = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > maxY) maxY = y;
      var delta = y - lastY;
      if (delta < 0) {
        if (upAccum === 0) upStart = Date.now();
        upAccum += -delta;
        if (maxY > MOBILE_MIN_DEPTH && upAccum >= MOBILE_UP_DELTA && (Date.now() - upStart) <= MOBILE_UP_WINDOW_MS) {
          show();
        }
      } else if (delta > 0) {
        upAccum = 0;
      }
      lastY = y;
    }, { passive: true });
  }
})();

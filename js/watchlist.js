(function () {
  'use strict';

  var STORAGE_KEY = 'hef_watchlist_dismissed_at';
  var SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;
  var MOBILE_MIN_DEPTH = 800;
  var MOBILE_UP_DELTA = 250;
  var MOBILE_UP_WINDOW_MS = 800;

  var popup = document.getElementById('exitPopup');
  if (!popup) return;

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

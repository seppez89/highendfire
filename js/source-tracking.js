/* ============================================
   HIGH END FIRE — Source tracking (first-touch + last-touch)
   Stores where a visitor came from in localStorage so the cart can pass it
   to Stripe Checkout as metadata. Nothing here is sent anywhere by itself.
   ============================================ */

(function () {
  'use strict';

  var KEY = 'hef_source';
  var MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  var MAX_LEN = 200;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function write(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      // Private mode or storage full. Tracking is optional, so carry on.
    }
  }

  function fresh(touch, now) {
    return !!(touch && typeof touch.ts === 'number' && now - touch.ts < MAX_AGE_MS);
  }

  function hasUtm(touch) {
    return UTM_KEYS.some(function (k) { return !!touch[k]; });
  }

  // Hostname only, and never our own site (an internal click is not a source).
  function referrerHost() {
    try {
      if (!document.referrer) return '';
      var host = new URL(document.referrer).hostname.toLowerCase();
      var own = window.location.hostname.toLowerCase();
      var strip = function (h) { return h.replace(/^www\./, ''); };
      return strip(host) === strip(own) ? '' : host;
    } catch (err) {
      return '';
    }
  }

  function capture() {
    var now = Date.now();
    var stored = read() || {};

    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (err) {
      params = null;
    }

    var utm = {};
    UTM_KEYS.forEach(function (k) {
      utm[k] = params ? clean(params.get(k)) : '';
    });

    var changed = false;

    // First touch: only written when there is none, or the old one has expired.
    if (!fresh(stored.first, now)) {
      var first = {
        ts: now,
        referrer: clean(referrerHost()),
        landing: clean(window.location.pathname)
      };
      UTM_KEYS.forEach(function (k) { first[k] = utm[k]; });
      stored.first = first;
      changed = true;
    }

    // Last touch: replaced whenever a visit arrives with any utm_* parameter.
    if (hasUtm(utm)) {
      var last = { ts: now };
      UTM_KEYS.forEach(function (k) { last[k] = utm[k]; });
      stored.last = last;
      changed = true;
    } else if (stored.last && !fresh(stored.last, now)) {
      delete stored.last;
      changed = true;
    }

    if (changed) write(stored);
  }

  // What the cart sends to /api/checkout. Empty fields are left out.
  function get() {
    var now = Date.now();
    var stored = read() || {};
    var out = {};
    var first = fresh(stored.first, now) ? stored.first : null;
    var last = fresh(stored.last, now) ? stored.last : null;

    if (first) {
      out.first = {
        utm_source: clean(first.utm_source),
        utm_medium: clean(first.utm_medium),
        utm_campaign: clean(first.utm_campaign),
        utm_content: clean(first.utm_content),
        referrer: clean(first.referrer),
        landing: clean(first.landing)
      };
    }
    if (last) {
      out.last = {
        utm_source: clean(last.utm_source),
        utm_medium: clean(last.utm_medium),
        utm_campaign: clean(last.utm_campaign),
        utm_content: clean(last.utm_content)
      };
    }
    return out;
  }

  try {
    capture();
  } catch (err) {
    // Never let tracking break a page.
  }

  window.HEFSource = { get: get };
})();

/* ============================================
   HIGH END FIRE — shop + category pages
   Price chips, sorting and the piece count for a product listing.
   Category chips are plain links and need no script.
   ============================================ */

(function () {
  'use strict';

  var toolbar = document.querySelector('[data-toolbar]');
  if (!toolbar) return;

  var grids = Array.prototype.slice.call(document.querySelectorAll('.products-grid'));
  var countEl = toolbar.querySelector('[data-count]');
  var emptyEl = document.querySelector('[data-empty]');
  var sortEl = toolbar.querySelector('[data-sort]');
  var priceBtns = Array.prototype.slice.call(toolbar.querySelectorAll('[data-price]'));
  var soldPage = document.querySelector('.chip--quiet.is-active') !== null;

  // Remember each card's place in the page so "Featured" can put it back.
  var cards = [];
  grids.forEach(function (grid) {
    Array.prototype.slice.call(grid.querySelectorAll('.product-card[data-product-id]')).forEach(function (card, i) {
      cards.push({
        el: card,
        grid: grid,
        order: i,
        price: parseFloat(card.getAttribute('data-product-price')) || 0,
        // The shop page lists the whole catalogue; sold pieces live on /sold.
        sold: card.getAttribute('data-stock') === '0'
      });
    });
  });

  var range = { min: 0, max: Infinity };

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (soldPage || !c.sold) && c.price >= range.min && c.price < range.max;
      c.el.hidden = !ok;
      if (ok) {
        shown++;
        c.el.classList.add('visible');   // skip the scroll-reveal wait for cards that just moved
      }
    });

    // A section with nothing left in it (the shop page has three) steps aside.
    grids.forEach(function (grid) {
      var section = grid.closest('.products-section');
      if (!section || grids.length < 2) return;
      var any = cards.some(function (c) { return c.grid === grid && !c.el.hidden; });
      section.hidden = !any;
    });

    if (countEl) countEl.textContent = shown + (shown === 1 ? ' piece' : ' pieces');
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  function sort(mode) {
    grids.forEach(function (grid) {
      var mine = cards.filter(function (c) { return c.grid === grid; });
      mine.sort(function (a, b) {
        if (mode === 'price-asc') return a.price - b.price || a.order - b.order;
        if (mode === 'price-desc') return b.price - a.price || a.order - b.order;
        return a.order - b.order;
      });
      mine.forEach(function (c) { grid.appendChild(c.el); });
    });
  }

  priceBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parts = btn.getAttribute('data-price').split('-');
      range = parts[0] === 'all'
        ? { min: 0, max: Infinity }
        : { min: parseFloat(parts[0]) || 0, max: parts[1] ? parseFloat(parts[1]) : Infinity };
      priceBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply();
    });
  });

  if (sortEl) sortEl.addEventListener('change', function () { sort(sortEl.value); });

  apply();
})();

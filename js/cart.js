/* ============================================
   HIGH END FIRE — Cart & Checkout System
   ============================================ */

(function () {
  'use strict';

  var CART_KEY = 'hef_cart';

  // Anything above this sells in conversation, not from a buy button. At this end
  // of the case the buyer wants photos, comps and a price chat before any money
  // moves — and we want to know who they are. Mirrored in api/_catalog.js, which
  // is what actually stops an over-threshold line item reaching checkout.
  var ENQUIRY_THRESHOLD = 3000;

  // The same reasoning applied to the basket rather than one card: four $900
  // cards is a $3,600 order, and a stranger sending that much unannounced is a
  // conversation we want to have first. Mirrored in api/_catalog.js.
  var ORDER_ENQUIRY_THRESHOLD = 3000;

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(amount) {
    return '$' + amount.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
  }

  // --- Cart State ---
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    updateCartCount();
  }

  // Stock available for a product, read from the live card. Returns 0 when the
  // card is gone (product pulled) or marked sold out.
  function getStock(id) {
    var card = document.querySelector('.product-card[data-product-id="' + id + '"]');
    if (!card) return 0;
    // Enquiry-only pieces are sold in conversation, not through the cart. Reporting
    // them as unavailable is what drops one out of a cart that was saved before the
    // switch, and stops addToCart ever taking one.
    if (card.hasAttribute('data-enquiry-only')) return 0;
    var stock = parseInt(card.getAttribute('data-stock'), 10);
    return isNaN(stock) ? 1 : Math.max(0, stock);
  }

  // Apply the enquiry threshold to the page itself. The high-end cards are marked
  // up by hand with data-enquiry-only, but a new one added without it would ship
  // an Add to Cart button on a five-figure slab. This runs synchronously (the
  // script sits below every product card), so both the attribute and the swapped
  // buttons are in place before init() reads stock and before main.js binds
  // [data-enquire].
  function applyEnquiryThreshold() {
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card) {
      var price = parseFloat(card.getAttribute('data-product-price'));
      if (!isFinite(price) || price <= ENQUIRY_THRESHOLD) return;

      card.setAttribute('data-enquiry-only', '1');

      // Sold cards have no Add to Cart button, so they keep their "Sold" state.
      card.querySelectorAll('.btn-add-to-cart').forEach(function (btn) {
        btn.classList.remove('btn-add-to-cart');
        btn.classList.add('btn-enquire');
        btn.setAttribute('data-enquire', '');
        btn.textContent = 'Enquire';
      });

      // A dollar figure next to an Enquire button reads as a price the buyer
      // can just pay — the point of enquiry-only is that they can't. Reuses the
      // --soon modifier already styled for "Prices TBA" cards.
      card.querySelectorAll('.product-card__price').forEach(function (span) {
        span.classList.remove('price-shimmer');
        span.classList.add('product-card__price--soon');
        span.textContent = 'Enquire for price';
      });
    });
  }

  applyEnquiryThreshold();

  // Bring a stored cart back in line with what's actually on the page. Carts
  // live in localStorage indefinitely, so items can sell out or have their
  // stock reduced between visits.
  function reconcileCart() {
    var cart = getCart();
    var changed = false;
    var reconciled = [];

    cart.forEach(function (item) {
      var stock = getStock(item.id);
      if (stock === 0) { changed = true; return; }
      var qty = Math.min(Math.max(1, item.quantity || 1), stock);
      if (qty !== item.quantity || item.maxQty !== stock) changed = true;
      item.quantity = qty;
      item.maxQty = stock;
      reconciled.push(item);
    });

    if (changed) saveCart(reconciled);
  }

  function addToCart(product) {
    var cart = getCart();
    var stock = getStock(product.id);

    if (stock === 0) {
      showCartNotification(product.name + ' is no longer available', 'error');
      return;
    }

    var exists = cart.find(function (item) { return item.id === product.id; });
    if (exists) {
      if (exists.quantity >= stock) {
        showCartNotification(
          stock === 1
            ? product.name + ' is already in your cart'
            : 'Only ' + stock + ' available — that’s all of them',
          stock === 1 ? null : 'error'
        );
        openCartDrawer();
        return;
      }
      exists.quantity += 1;
      exists.maxQty = stock;
      saveCart(cart);
      showCartNotification(product.name + ' × ' + exists.quantity + ' in cart');
      openCartDrawer();
      return;
    }

    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      condition: product.condition,
      image: product.image,
      quantity: 1,
      maxQty: stock
    });
    saveCart(cart);
    showCartNotification(product.name + ' added to cart');
    openCartDrawer();
  }

  // Set an absolute quantity. Anything at or below zero removes the line.
  function setQuantity(id, qty) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;

    var stock = getStock(id);
    if (stock === 0) { removeFromCart(id); return; }

    qty = Math.min(Math.max(0, Math.floor(qty)), stock);
    if (qty === 0) { removeFromCart(id); return; }

    item.quantity = qty;
    item.maxQty = stock;
    saveCart(cart);
  }

  function changeQuantity(id, delta) {
    var item = getCart().find(function (i) { return i.id === id; });
    if (item) setQuantity(id, (item.quantity || 1) + delta);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (item) { return item.id !== id; });
    saveCart(cart);
  }

  function getCartTotal() {
    return getCart().reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) { return sum + item.quantity; }, 0);
  }

  // --- Cart Drawer ---
  function createCartDrawer() {
    var drawer = document.createElement('div');
    drawer.id = 'cartDrawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = [
      '<div class="cart-drawer__backdrop" onclick="window.HEFCart.close()"></div>',
      '<div class="cart-drawer__panel">',
      '  <div class="cart-drawer__header">',
      '    <h3 class="cart-drawer__title">Your Cart</h3>',
      '    <button class="cart-drawer__close" onclick="window.HEFCart.close()">&times;</button>',
      '  </div>',
      '  <div class="cart-drawer__items" id="cartItems"></div>',
      '  <div class="cart-drawer__footer" id="cartFooter">',
      '    <div class="cart-drawer__total">',
      '      <span>Total</span>',
      '      <span id="cartTotal">$0.00 AUD</span>',
      '    </div>',
      '    <button class="btn btn--primary btn--lg btn--full" id="checkoutBtn" onclick="window.HEFCart.checkout()">',
      '      Proceed to Checkout',
      '      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      '    </button>',
      '    <div class="cart-drawer__secure">',
      '      <span>🔒</span> Secure checkout powered by Stripe',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(drawer);
  }

  function openCartDrawer() {
    var drawer = document.getElementById('cartDrawer');
    if (drawer) {
      drawer.classList.add('cart-drawer--open');
      document.body.style.overflow = 'hidden';
      updateCartUI();
    }
  }

  function closeCartDrawer() {
    var drawer = document.getElementById('cartDrawer');
    if (drawer) {
      drawer.classList.remove('cart-drawer--open');
      document.body.style.overflow = '';
    }
  }

  function updateCartUI() {
    var container = document.getElementById('cartItems');
    var footer = document.getElementById('cartFooter');
    var totalEl = document.getElementById('cartTotal');
    if (!container) return;

    var cart = getCart();

    if (cart.length === 0) {
      container.innerHTML = [
        '<div class="cart-drawer__empty">',
        '  <div style="font-size:40px;margin-bottom:12px;">🛒</div>',
        '  <p>Your cart is empty</p>',
        '  <span>Browse our collection and add items to get started.</span>',
        '</div>'
      ].join('\n');
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    var html = '';
    cart.forEach(function (item) {
      var qty = item.quantity || 1;
      var max = item.maxQty || 1;

      // Steppers only appear where there's actually stock to step through —
      // 1-of-1 collectables stay visually unchanged.
      var qtyRow = '';
      if (max > 1) {
        qtyRow = [
          '    <div class="cart-item__qty">',
          '      <button class="cart-item__qty-btn" data-action="dec" data-id="' + esc(item.id) + '"' + (qty <= 1 ? ' disabled' : '') + ' aria-label="Decrease quantity">&minus;</button>',
          '      <span class="cart-item__qty-value" aria-live="polite">' + qty + '</span>',
          '      <button class="cart-item__qty-btn" data-action="inc" data-id="' + esc(item.id) + '"' + (qty >= max ? ' disabled' : '') + ' aria-label="Increase quantity">+</button>',
          qty >= max ? '      <span class="cart-item__qty-max">max</span>' : '',
          '    </div>'
        ].filter(Boolean).join('\n');
      }

      html += [
        '<div class="cart-item" data-id="' + esc(item.id) + '">',
        '  <div class="cart-item__image">',
        '    <img src="' + esc(item.image) + '" alt="' + esc(item.name) + '">',
        '  </div>',
        '  <div class="cart-item__info">',
        '    <span class="cart-item__condition">' + esc(item.condition || '') + '</span>',
        '    <h4 class="cart-item__name">' + esc(item.name) + '</h4>',
        '    <span class="cart-item__price">' + money(item.price) + (qty > 1 ? ' <span class="cart-item__each">each</span>' : '') + '</span>',
        qtyRow,
        qty > 1 ? '    <span class="cart-item__subtotal">' + money(item.price * qty) + '</span>' : '',
        '  </div>',
        '  <button class="cart-item__remove" data-action="remove" data-id="' + esc(item.id) + '" title="Remove">',
        '    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        '  </button>',
        '</div>'
      ].filter(Boolean).join('\n');
    });
    container.innerHTML = html;

    if (totalEl) {
      totalEl.textContent = money(getCartTotal());
    }

    updateCheckoutMode();
  }

  // Swap the footer between "pay now" and "let's talk" depending on the order
  // total. Rebuilt from scratch each time rather than toggled, so the drawer
  // can't get stuck showing the wrong one after items are removed.
  function updateCheckoutMode() {
    var btn = document.getElementById('checkoutBtn');
    var secure = document.querySelector('.cart-drawer__secure');
    if (!btn) return;

    var enquire = getCartTotal() > ORDER_ENQUIRY_THRESHOLD;

    btn.disabled = false;
    btn.classList.toggle('btn-order-enquire', enquire);
    btn.setAttribute('data-mode', enquire ? 'enquire' : 'checkout');
    btn.innerHTML = enquire
      ? 'Enquire about this order'
      : 'Proceed to Checkout <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    if (secure) {
      // The enquiry note is two lines of copy where the Stripe line is a few
      // words, so it gets a modifier that lets it wrap instead of squashing.
      secure.classList.toggle('cart-drawer__secure--enquire', enquire);
      secure.innerHTML = enquire
        ? '<span>💬</span> Orders over ' + money(ORDER_ENQUIRY_THRESHOLD).replace('.00 AUD', '') +
          ' are arranged personally — we\'ll confirm the cards and sort payment and delivery with you.'
        : '<span>🔒</span> Secure checkout powered by Stripe';
    }
  }

  /**
   * Hand a large order to the contact form with the basket already written out,
   * so the buyer doesn't have to describe what they wanted and we know exactly
   * what to quote. Same destination as a single card's Enquire button.
   */
  function enquireAboutOrder() {
    var cart = getCart();
    if (!cart.length) return;

    closeCartDrawer();

    var section = document.getElementById('contact');
    if (!section) return;

    window.scrollTo({
      top: section.getBoundingClientRect().top + window.pageYOffset - 80,
      behavior: 'smooth'
    });

    var subject = document.getElementById('subject');
    if (subject && subject.querySelector('option[value="pokemon"]')) subject.value = 'pokemon';

    var message = document.getElementById('message');
    if (message && !message.value.trim()) {
      var lines = cart.map(function (item) {
        var qty = item.quantity || 1;
        return '- ' + item.name + (qty > 1 ? ' × ' + qty : '') + ' (' + money(item.price * qty) + ')';
      });
      message.value =
        'I\'d like to enquire about this order:\n' + lines.join('\n') +
        '\n\nTotal: ' + money(getCartTotal()) +
        '\n\nCould you confirm availability and let me know how you\'d like to arrange payment and delivery?';
    }

    setTimeout(function () {
      var nameField = document.getElementById('name');
      var target = (nameField && !nameField.value) ? nameField : message;
      if (target) { try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); } }
    }, 600);
  }

  function updateCartCount() {
    var badges = document.querySelectorAll('.cart-count');
    var count = getCartCount();
    badges.forEach(function (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // --- Notification ---
  function showCartNotification(message, variant) {
    var existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    var isError = variant === 'error';
    var el = document.createElement('div');
    el.className = 'cart-notification' + (isError ? ' cart-notification--error' : '');
    el.innerHTML = '<span>' + (isError ? '!' : '✓') + '</span> ' + esc(message);
    document.body.appendChild(el);

    requestAnimationFrame(function () {
      el.classList.add('cart-notification--visible');
    });

    setTimeout(function () {
      el.classList.remove('cart-notification--visible');
      setTimeout(function () { el.remove(); }, 300);
    }, 2500);
  }

  // --- Checkout ---
  async function checkout() {
    var cart = getCart();
    if (cart.length === 0) return;

    // The button already reads "Enquire about this order" past the threshold, but
    // this is the same call the button makes, so the branch belongs here too —
    // otherwise a stale drawer or a console call walks straight into Stripe.
    if (getCartTotal() > ORDER_ENQUIRY_THRESHOLD) {
      enquireAboutOrder();
      return;
    }

    var btn = document.getElementById('checkoutBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing...';
    }

    try {
      // Only ids and quantities — the server prices the cart from its own
      // catalogue, so anything else we sent would be ignored anyway.
      var res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(function (item) {
            return { id: item.id, quantity: item.quantity || 1 };
          }),
          origin: window.location.origin
        })
      });

      var data = await res.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // 409 means the cart disagrees with live stock or listings — the message
      // is written for the buyer, so show it and re-sync rather than falling
      // through to the generic "contact us" copy.
      if (res.status === 409 && data.error) {
        resetCheckoutButton();
        reconcileCart();
        updateCartUI();
        showCartNotification(data.error, 'error');
        // The server refuses large orders too. If that's why we're here, send the
        // buyer somewhere useful instead of leaving them at a dead end.
        if (data.orderEnquiryRequired) enquireAboutOrder();
        return;
      }

      throw new Error(data.error || 'Checkout failed');
    } catch (err) {
      resetCheckoutButton();
      alert('Checkout is being set up. Please use the Enquire button or contact us directly at jonathon@highendfire.com.au to purchase.');
    }
  }

  // Restores whichever label the current total calls for, rather than assuming
  // "Proceed to Checkout" — a failed checkout on a basket that has since grown
  // past the threshold should come back as the enquiry button.
  function resetCheckoutButton() {
    updateCheckoutMode();
  }

  // --- Add to Cart from product cards ---
  function initProductCards() {
    document.querySelectorAll('.product-card[data-product-id]').forEach(function (card) {
      var btns = card.querySelectorAll('.btn-add-to-cart');
      if (!btns.length) return;

      btns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var product = {
            id: card.getAttribute('data-product-id'),
            name: card.getAttribute('data-product-name'),
            price: parseFloat(card.getAttribute('data-product-price')),
            condition: card.getAttribute('data-product-condition') || '',
            image: card.getAttribute('data-product-image') || ''
          };
          addToCart(product);
        });
      });
    });
  }

  // Quantity and remove buttons are re-rendered on every cart change, so bind
  // once on the container rather than per button.
  function initCartControls() {
    var container = document.getElementById('cartItems');
    if (!container) return;

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();

      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');

      if (action === 'inc') changeQuantity(id, 1);
      else if (action === 'dec') changeQuantity(id, -1);
      else if (action === 'remove') removeFromCart(id);
    });
  }

  // --- Init ---
  function init() {
    createCartDrawer();
    initProductCards();
    initCartControls();
    reconcileCart();
    updateCartCount();

    // Cart button in header
    document.querySelectorAll('.cart-trigger').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openCartDrawer();
      });
    });
  }

  // Public API
  window.HEFCart = {
    open: openCartDrawer,
    close: closeCartDrawer,
    remove: removeFromCart,
    checkout: checkout,
    add: addToCart,
    setQuantity: setQuantity,
    changeQuantity: changeQuantity
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

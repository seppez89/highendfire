/* ============================================
   HIGH END FIRE — Cart & Checkout System
   ============================================ */

(function () {
  'use strict';

  var CART_KEY = 'hef_cart';

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

  function addToCart(product) {
    var cart = getCart();
    // Check if already in cart (unique items only — collectables are 1-of-1)
    var exists = cart.find(function (item) { return item.id === product.id; });
    if (exists) {
      showCartNotification(product.name + ' is already in your cart');
      openCartDrawer();
      return;
    }
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      condition: product.condition,
      image: product.image,
      quantity: 1
    });
    saveCart(cart);
    showCartNotification(product.name + ' added to cart');
    openCartDrawer();
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
      html += [
        '<div class="cart-item" data-id="' + item.id + '">',
        '  <div class="cart-item__image">',
        '    <img src="' + item.image + '" alt="' + item.name + '">',
        '  </div>',
        '  <div class="cart-item__info">',
        '    <span class="cart-item__condition">' + (item.condition || '') + '</span>',
        '    <h4 class="cart-item__name">' + item.name + '</h4>',
        '    <span class="cart-item__price">$' + item.price.toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD</span>',
        '  </div>',
        '  <button class="cart-item__remove" onclick="window.HEFCart.remove(\'' + item.id + '\')" title="Remove">',
        '    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        '  </button>',
        '</div>'
      ].join('\n');
    });
    container.innerHTML = html;

    if (totalEl) {
      totalEl.textContent = '$' + getCartTotal().toLocaleString('en-AU', { minimumFractionDigits: 2 }) + ' AUD';
    }
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
  function showCartNotification(message) {
    var existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.className = 'cart-notification';
    el.innerHTML = '<span>✓</span> ' + message;
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

    var btn = document.getElementById('checkoutBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing...';
    }

    try {
      var res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          origin: window.location.origin
        })
      });

      var data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Proceed to Checkout <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      alert('Checkout is being set up. Please use the Enquire button or contact us directly at jonathon@beatthefire.com.au to purchase.');
    }
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

  // --- Init ---
  function init() {
    createCartDrawer();
    initProductCards();
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
    add: addToCart
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================
   HIGH END FIRE — Main JS
   ============================================ */

(function () {
  'use strict';

  // --- Mobile Nav Toggle ---
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('nav--open');
    });

    // Close nav on link click
    mainNav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('nav--open');
      });
    });
  }

  // --- Scroll Reveal ---
  function revealOnScroll() {
    var elements = document.querySelectorAll('.product-card, .feature-card, .trust-badge');
    var windowHeight = window.innerHeight;

    elements.forEach(function (el, index) {
      var rect = el.getBoundingClientRect();
      if (rect.top < windowHeight - 60) {
        // Stagger animation
        setTimeout(function () {
          el.classList.add('visible');
        }, index % 3 * 100);
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('load', revealOnScroll);

  // --- Fake Viewer Count (urgency) ---
  var viewerCount = document.getElementById('viewerCount');
  if (viewerCount) {
    setInterval(function () {
      var base = 18;
      var variation = Math.floor(Math.random() * 15);
      viewerCount.textContent = base + variation;
    }, 4000);
  }

  // --- Urgency Toast Notifications ---
  var toastEl = document.getElementById('urgencyToast');
  var toastMessages = [
    { icon: '👀', title: 'High Interest', message: '12 people viewing the Fossil Set right now' },
    { icon: '🔥', title: 'Almost Gone!', message: 'Dragonite Fossil Holo — only 1 left' },
    { icon: '🏆', title: 'Collector Pick', message: 'Lillie\'s Determination SAR trending this week' },
    { icon: '🔥', title: 'Price Rising', message: 'Mewtwo ex #125 up 15% this month' },
  ];

  var toastIndex = 0;

  function showToast() {
    if (!toastEl) return;

    var msg = toastMessages[toastIndex % toastMessages.length];
    var icon = toastEl.querySelector('.toast__icon');
    var title = toastEl.querySelector('.toast__title');
    var message = toastEl.querySelector('.toast__message');

    if (icon) icon.textContent = msg.icon;
    if (title) title.textContent = msg.title;
    if (message) message.textContent = msg.message;

    toastEl.classList.add('toast--visible');

    setTimeout(function () {
      toastEl.classList.remove('toast--visible');
    }, 5000);

    toastIndex++;
  }

  // First toast after 8s, then every 25s
  setTimeout(function () {
    showToast();
    setInterval(showToast, 25000);
  }, 8000);

  // --- Watchlist Forms (AJAX via FormSubmit.co) ---
  document.querySelectorAll('[data-watchlist-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var fineprint = form.closest('form') ? form.parentElement.querySelector('[data-watchlist-fineprint]') : null;
      if (!fineprint) fineprint = form.parentElement.querySelector('[data-watchlist-fineprint]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.json();
        })
        .then(function (data) {
          if (data && (data.success === 'true' || data.success === true)) {
            form.innerHTML = '<p class="watchlist-success">You\'re on the list! Check your inbox.</p>';
            if (fineprint) fineprint.textContent = '';
          } else {
            throw new Error('failed');
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Send Me the Watchlist'; }
          var err = form.querySelector('.watchlist-error');
          if (!err) {
            err = document.createElement('p');
            err.className = 'watchlist-error';
            err.textContent = 'Something went wrong. Please try again.';
            form.appendChild(err);
          }
        });
    });
  });

  // --- Contact Form (AJAX via FormSubmit.co) ---
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var contactAction = contactForm.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      fetch(contactAction, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success === 'true') {
            contactForm.innerHTML = [
              '<div class="contact-success">',
              '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">',
              '<circle cx="24" cy="24" r="24" fill="rgba(224,92,42,.15)"/>',
              '<path d="M14 24l8 8 12-16" stroke="#e05c2a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
              '</svg>',
              '<h3>Message sent!</h3>',
              '<p>We\'ll get back to you within 24 hours.</p>',
              '</div>'
            ].join('');
          } else {
            throw new Error('failed');
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Send Enquiry'; }
          var note = contactForm.querySelector('.contact-form__note');
          if (note) note.textContent = 'Something went wrong. Please try again or email us directly.';
        });
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // --- Header scroll effect ---
  var header = document.querySelector('.header');
  var lastScroll = 0;

  window.addEventListener('scroll', function () {
    var currentScroll = window.pageYOffset;
    if (currentScroll > 100) {
      header.style.borderBottomColor = 'rgba(224, 92, 42, 0.15)';
    } else {
      header.style.borderBottomColor = '';
    }
    lastScroll = currentScroll;
  });

})();

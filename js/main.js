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

  // --- Reveal on view ---
  // Cards and sections fade up once, as they come into view, and never go back.
  // The observer fires a little before an element reaches the screen so nothing
  // is ever seen half-faded while scrolling. Driven by what is in view, never
  // by scroll position.
  (function () {
    var targets = Array.prototype.slice.call(document.querySelectorAll(
      '.section-reveal, .product-card, .feature-card, .trust-badge'));
    if (!targets.length) return;

    function show(el) {
      if (el.classList.contains('visible')) return;
      el.classList.add('visible');
      var titles = el.querySelectorAll ? el.querySelectorAll('.title-underline') : [];
      Array.prototype.forEach.call(titles, function (t) { t.classList.add('revealed'); });
    }

    if (!('IntersectionObserver' in window)) { targets.forEach(show); return; }

    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        io.unobserve(e.target);
        // Small stagger across whatever arrives together (one row of cards).
        var delay = e.target.classList.contains('section-reveal') ? 0 : Math.min(i, 5) * 45;
        if (delay) setTimeout(function () { show(e.target); }, delay);
        else show(e.target);
      });
    }, { rootMargin: '0px 0px 14% 0px', threshold: 0 });

    targets.forEach(function (el) { io.observe(el); });

    // Belt and braces: anything on screen is shown once the page has settled,
    // whatever the observer did.
    window.addEventListener('load', function () {
      setTimeout(function () {
        var vh = window.innerHeight || 800;
        targets.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) show(el);
        });
      }, 1200);
    });
  })();

  // --- Watchlist Forms (AJAX via /api/subscribe → Brevo) ---
  document.querySelectorAll('[data-watchlist-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var fineprint = form.closest('form') ? form.parentElement.querySelector('[data-watchlist-fineprint]') : null;
      if (!fineprint) fineprint = form.parentElement.querySelector('[data-watchlist-fineprint]');
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

  // --- Enquiries (pieces sold in conversation, not through the cart) ---
  // The top of the case doesn't sell from a buy button — those cards carry
  // data-enquiry-only and an Enquire button instead. Take the buyer to the
  // contact form with the card already named so they never have to describe it.
  //
  // The form only exists on the homepage. On a shop, category or product page
  // the message is parked in sessionStorage and the buyer is sent to /#contact,
  // where it is picked up again on load.
  var ENQUIRY_KEY = 'hef_enquiry';

  function fillEnquiry(subjectValue, text) {
    var section = document.getElementById('contact');
    if (!section) return false;

    // Same offset the nav anchors use, so the fixed header doesn't cover the
    // form heading. scrollIntoView doesn't move this page.
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.pageYOffset - 80,
      behavior: 'instant'
    });

    var subject = document.getElementById('subject');
    if (subject && subject.querySelector('option[value="' + subjectValue + '"]')) subject.value = subjectValue;

    var message = document.getElementById('message');
    if (message && text && !message.value.trim()) message.value = text;

    // Focus the first empty field so they can start typing straight away.
    setTimeout(function () {
      var nameField = document.getElementById('name');
      var target = (nameField && !nameField.value) ? nameField : message;
      if (target) { try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); } }
    }, 300);
    return true;
  }

  window.HEFEnquiry = {
    go: function (subjectValue, text) {
      if (fillEnquiry(subjectValue, text)) return;
      try {
        sessionStorage.setItem(ENQUIRY_KEY, JSON.stringify({ subject: subjectValue, text: text }));
      } catch (err) { /* private mode: they still land on the form, just unfilled */ }
      window.location.href = '/#contact';
    }
  };

  // Bound on the document rather than per button: cart.js swaps Add to Cart for
  // Enquire on anything over the enquiry threshold, so the buttons aren't all in
  // the DOM at bind time.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-enquire]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    var card = btn.closest('.product-card[data-product-id]');
    var name = card ? card.getAttribute('data-product-name') : '';

    // Dragon Ball has its own enquiry topic; One Piece doesn't, so it goes to
    // "Other" rather than being mislabelled as a Pokemon enquiry.
    var option = 'pokemon';
    if (/dragon ball|fusion world|goku|gohan|raditz/i.test(name)) option = 'dragonball';
    else if (/one piece|romance dawn/i.test(name)) option = 'other';

    window.HEFEnquiry.go(option, name
      ? 'I’d like to enquire about the ' + name + '. '
        + 'Could you send me more photos or a video, and let me know what you can do on price?'
      : '');
  });

  // --- FAQ: the first few questions show, one button reveals the rest ---
  var faqToggle = document.querySelector('[data-faq-toggle]');
  var faqMore = document.getElementById('faqMore');
  if (faqToggle && faqMore) {
    faqToggle.addEventListener('click', function () {
      var open = faqMore.hidden;
      faqMore.hidden = !open;
      faqToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      faqToggle.textContent = open ? 'Show fewer questions' : 'Show all ' + faqToggle.getAttribute('data-count') + ' questions';
    });
  }

  // --- Contact Form (AJAX via /api/contact) ---
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var fd = new FormData(contactForm);
      var payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });

      fetch(contactForm.action, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data && res.data.success) {
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

  // --- Arriving with a #section in the URL ---
  // Product pages, category pages and the footer all link to /#contact,
  // /#about etc. The browser's own jump is unreliable here (smooth scrolling
  // plus images loading in above the target), so land on the section explicitly
  // once the page has settled. An enquiry carried over from another page wins.
  window.addEventListener('load', function () {
    var pending = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(ENQUIRY_KEY) || 'null');
      sessionStorage.removeItem(ENQUIRY_KEY);
    } catch (err) { pending = null; }
    if (pending && fillEnquiry(pending.subject, pending.text)) return;

    if (!location.hash || location.hash.length < 2) return;
    var target;
    try { target = document.querySelector(location.hash); } catch (e) { return; }
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
    // 'instant', not 'auto': auto would inherit the page's smooth scrolling.
    window.scrollTo({ top: top, behavior: 'instant' });
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

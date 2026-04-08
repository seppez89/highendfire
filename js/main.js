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
    { icon: '🔥', title: 'Just Sold!', message: 'Charizard Base Set Holo sold 2 hours ago' },
    { icon: '👀', title: 'High Interest', message: '12 people viewing the Fossil Set right now' },
    { icon: '📦', title: 'Shipped Today', message: 'Mew ex shipped to Melbourne, VIC' },
    { icon: '🔥', title: 'Almost Gone!', message: 'Dragonite Fossil Holo — only 1 left' },
    { icon: '⭐', title: '5-Star Review', message: '"Amazing condition, fast shipping!" — Josh M.' },
    { icon: '🏆', title: 'Collector Pick', message: 'Lillie\'s Determination SAR trending this week' },
    { icon: '📦', title: 'Shipped Today', message: 'Cynthia Full Art shipped to Sydney, NSW' },
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

  // --- Contact Form (handled by FormSubmit.co) ---
  // Form submits natively via action attribute to jonathon@beatthefire.com.au

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

/* ============================================
   HIGH END FIRE — Interactive Effects
   Cursor/touch glow, 3D tilt, scroll progress,
   magnetic buttons, fire particles, dot grid,
   section reveals, card spotlights
   Mobile + Desktop optimised
   ============================================ */

(function () {
  'use strict';

  var isTouch = 'ontouchstart' in window;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Throttle helper for scroll/touch perf
  function throttle(fn, wait) {
    var last = 0, timer = null;
    return function () {
      var now = Date.now();
      var remaining = wait - (now - last);
      var ctx = this, args = arguments;
      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        last = now;
        fn.apply(ctx, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          last = Date.now();
          timer = null;
          fn.apply(ctx, args);
        }, remaining);
      }
    };
  }

  // --- Scroll Progress Bar ---
  var progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    var updateProgress = throttle(function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }, 16);
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  // --- Cursor / Touch Glow ---
  var cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow) {
    var glowX = -500, glowY = -500, currentX = -500, currentY = -500;
    var glowSize = isMobile ? 150 : 200;
    var glowOffset = glowSize;
    var glowActive = false;
    var glowRAF = null;

    if (isMobile) {
      cursorGlow.style.width = glowSize * 2 + 'px';
      cursorGlow.style.height = glowSize * 2 + 'px';
    }

    function animateGlow() {
      currentX += (glowX - currentX) * 0.15;
      currentY += (glowY - currentY) * 0.15;
      cursorGlow.style.transform = 'translate(' + (currentX - glowOffset) + 'px, ' + (currentY - glowOffset) + 'px)';
      if (glowActive) {
        glowRAF = requestAnimationFrame(animateGlow);
      }
    }

    function startGlow() {
      if (!glowActive) {
        glowActive = true;
        cursorGlow.style.opacity = '1';
        animateGlow();
      }
    }

    function stopGlow() {
      glowActive = false;
      if (glowRAF) cancelAnimationFrame(glowRAF);
      cursorGlow.style.opacity = '0';
    }

    // Desktop: mouse
    document.addEventListener('mousemove', function (e) {
      glowX = e.clientX;
      glowY = e.clientY;
      startGlow();
    });
    document.addEventListener('mouseleave', stopGlow);

    // Mobile: touch
    if (isTouch) {
      document.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        glowX = t.clientX;
        glowY = t.clientY;
        currentX = glowX;
        currentY = glowY;
        startGlow();
      }, { passive: true });

      document.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        glowX = t.clientX;
        glowY = t.clientY;
        startGlow();
      }, { passive: true });

      document.addEventListener('touchend', function () {
        setTimeout(stopGlow, 600);
      }, { passive: true });
    }
  }

  // --- Card Spotlight Effect ---
  var spotlightCards = document.querySelectorAll('.card-spotlight');
  spotlightCards.forEach(function (card) {
    // Desktop
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px');
    });
    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--spot-x', '-999px');
      card.style.setProperty('--spot-y', '-999px');
    });

    // Mobile: touch
    if (isTouch) {
      card.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', (t.clientX - rect.left) + 'px');
        card.style.setProperty('--spot-y', (t.clientY - rect.top) + 'px');
      }, { passive: true });

      card.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', (t.clientX - rect.left) + 'px');
        card.style.setProperty('--spot-y', (t.clientY - rect.top) + 'px');
      }, { passive: true });

      card.addEventListener('touchend', function () {
        card.style.setProperty('--spot-x', '-999px');
        card.style.setProperty('--spot-y', '-999px');
      }, { passive: true });
    }
  });

  // --- 3D Tilt Effect on Product Cards ---
  var tiltCards = document.querySelectorAll('.tilt-3d');
  var tiltStrength = isMobile ? 6 : 10;

  tiltCards.forEach(function (card) {
    function applyTilt(x, y) {
      var rect = card.getBoundingClientRect();
      var xRatio = (x - rect.left) / rect.width;
      var yRatio = (y - rect.top) / rect.height;
      var rotateX = (yRatio - 0.5) * -tiltStrength;
      var rotateY = (xRatio - 0.5) * tiltStrength;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
    }

    function resetTilt() {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }

    // Desktop
    card.addEventListener('mousemove', function (e) {
      applyTilt(e.clientX, e.clientY);
    });
    card.addEventListener('mouseleave', resetTilt);

    // Mobile
    if (isTouch) {
      card.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        applyTilt(t.clientX, t.clientY);
      }, { passive: true });

      card.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        applyTilt(t.clientX, t.clientY);
      }, { passive: true });

      card.addEventListener('touchend', function () {
        setTimeout(resetTilt, 300);
      }, { passive: true });
    }

    // Gyroscope tilt on mobile (bonus effect)
    if (isTouch && window.DeviceOrientationEvent) {
      var gyroActive = false;
      var gyroHandler = throttle(function (e) {
        if (!gyroActive) return;
        var gamma = e.gamma || 0; // left-right tilt (-90 to 90)
        var beta = e.beta || 0;   // front-back tilt (-180 to 180)
        var rotateY = (gamma / 90) * tiltStrength * 0.5;
        var rotateX = ((beta - 45) / 90) * -tiltStrength * 0.5;
        rotateX = Math.max(-tiltStrength, Math.min(tiltStrength, rotateX));
        rotateY = Math.max(-tiltStrength, Math.min(tiltStrength, rotateY));
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      }, 50);

      // Only activate gyro when card is in viewport
      if ('IntersectionObserver' in window) {
        var gyroObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            gyroActive = entry.isIntersecting;
            if (!gyroActive) resetTilt();
          });
        }, { threshold: 0.3 });
        gyroObserver.observe(card);
      }

      window.addEventListener('deviceorientation', gyroHandler, { passive: true });
    }
  });

  // --- Magnetic Button Effect ---
  var magneticBtns = document.querySelectorAll('.btn-magnetic');
  magneticBtns.forEach(function (btn) {
    // Desktop
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translate(0, 0)';
    });

    // Mobile: subtle scale pulse on tap
    if (isTouch) {
      btn.addEventListener('touchstart', function () {
        btn.style.transform = 'scale(1.05)';
      }, { passive: true });
      btn.addEventListener('touchend', function () {
        setTimeout(function () {
          btn.style.transform = 'scale(1)';
        }, 150);
      }, { passive: true });
    }
  });

  // --- Section Reveal via IntersectionObserver ---
  var revealSections = document.querySelectorAll('.section-reveal');
  if (revealSections.length > 0 && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealSections.forEach(function (section) {
      revealObserver.observe(section);
    });
  }

  // --- Title Underline Reveal on Scroll ---
  var titleUnderlines = document.querySelectorAll('.title-underline');
  if (titleUnderlines.length > 0 && 'IntersectionObserver' in window) {
    var titleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          titleObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    titleUnderlines.forEach(function (title) {
      titleObserver.observe(title);
    });
  }

  // --- Fire Particles (floating embers) ---
  var heroSection = document.querySelector('.hero');
  if (heroSection) {
    var maxParticles = isMobile ? 8 : 20;
    var particleInterval = isMobile ? 1500 : 800;
    var activeParticles = 0;

    function createFireParticle() {
      if (activeParticles >= maxParticles) return;

      var particle = document.createElement('div');
      particle.classList.add('fire-particle');
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.bottom = '-10px';
      var duration = (4 + Math.random() * 6);
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = (Math.random() * 1) + 's';

      var size = isMobile ? (1.5 + Math.random() * 2.5) : (2 + Math.random() * 4);
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';

      var colors = ['#E05C2A', '#FF8C5A', '#FF7040', '#FF4500', '#FF6633'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];

      // Use will-change for GPU acceleration on mobile
      particle.style.willChange = 'transform, opacity';

      document.body.appendChild(particle);
      activeParticles++;

      setTimeout(function () {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
        activeParticles--;
      }, (duration + 1) * 1000);
    }

    // Only emit particles when hero is visible (performance)
    var particleTimer = null;
    if ('IntersectionObserver' in window) {
      var particleObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!particleTimer) {
              particleTimer = setInterval(createFireParticle, particleInterval);
              // Initial burst
              for (var i = 0; i < (isMobile ? 3 : 5); i++) {
                setTimeout(createFireParticle, i * 200);
              }
            }
          } else {
            if (particleTimer) {
              clearInterval(particleTimer);
              particleTimer = null;
            }
          }
        });
      }, { threshold: 0.1 });
      particleObserver.observe(heroSection);
    } else {
      // Fallback: always emit
      particleTimer = setInterval(createFireParticle, particleInterval);
    }
  }

  // --- Interactive Dot Grid on Hero ---
  var gridContainer = document.querySelector('.interactive-grid');
  if (gridContainer) {
    var spacing = isMobile ? 50 : 40;
    var parentEl = gridContainer.parentElement;
    var parentRect = parentEl.getBoundingClientRect();
    var cols = Math.ceil(parentRect.width / spacing);
    var rows = Math.ceil(parentRect.height / spacing);
    var maxDots = isMobile ? Math.min(cols * rows, 150) : Math.min(cols * rows, 400);

    var dots = [];
    for (var d = 0; d < maxDots; d++) {
      var col = d % cols;
      var row = Math.floor(d / cols);
      if (row >= rows) break;

      var dot = document.createElement('div');
      dot.className = 'grid-dot';
      dot.style.left = (col * spacing + spacing / 2) + 'px';
      dot.style.top = (row * spacing + spacing / 2) + 'px';
      gridContainer.appendChild(dot);
      dots.push({
        el: dot,
        x: col * spacing + spacing / 2,
        y: row * spacing + spacing / 2
      });
    }

    var activationRadius = isMobile ? 60 : 80;

    function activateDots(mx, my) {
      dots.forEach(function (dot) {
        var dx = mx - dot.x;
        var dy = my - dot.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < activationRadius) {
          dot.el.classList.add('active');
        } else {
          dot.el.classList.remove('active');
        }
      });
    }

    function clearDots() {
      dots.forEach(function (dot) {
        dot.el.classList.remove('active');
      });
    }

    // Desktop
    parentEl.addEventListener('mousemove', function (e) {
      var rect = parentEl.getBoundingClientRect();
      activateDots(e.clientX - rect.left, e.clientY - rect.top);
    });
    parentEl.addEventListener('mouseleave', clearDots);

    // Mobile
    if (isTouch) {
      parentEl.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        var rect = parentEl.getBoundingClientRect();
        activateDots(t.clientX - rect.left, t.clientY - rect.top);
      }, { passive: true });

      parentEl.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        var rect = parentEl.getBoundingClientRect();
        activateDots(t.clientX - rect.left, t.clientY - rect.top);
      }, { passive: true });

      parentEl.addEventListener('touchend', function () {
        setTimeout(clearDots, 500);
      }, { passive: true });

      // Auto-animate random dots on mobile for ambient effect
      var autoAnimateInterval = setInterval(function () {
        // Pick 3 random dots to pulse
        for (var a = 0; a < 3; a++) {
          var randomDot = dots[Math.floor(Math.random() * dots.length)];
          if (randomDot) {
            randomDot.el.classList.add('active');
            (function (d) {
              setTimeout(function () { d.el.classList.remove('active'); }, 800);
            })(randomDot);
          }
        }
      }, 2000);

      // Stop auto-animate when hero leaves viewport
      if ('IntersectionObserver' in window) {
        var gridObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting && autoAnimateInterval) {
              clearInterval(autoAnimateInterval);
              autoAnimateInterval = null;
            }
          });
        }, { threshold: 0.05 });
        gridObserver.observe(parentEl);
      }
    }
  }

  // --- Animated Stat Counters in Hero ---
  var statNumbers = document.querySelectorAll('.hero__stats .stat__number[data-count]');
  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var suffix = el.getAttribute('data-suffix') || '';
          var prefix = el.getAttribute('data-prefix') || '';
          var duration = 2000;
          var startTime = null;

          function animateCount(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * target);

            if (target % 1 !== 0) {
              current = (eased * target).toFixed(1);
            }

            el.textContent = prefix + current + suffix;

            if (progress < 1) {
              requestAnimationFrame(animateCount);
            }
          }

          requestAnimationFrame(animateCount);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statNumbers.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  // --- Parallax on Hero Background Elements ---
  var ambientGlows = document.querySelectorAll('.ambient-glow');
  if (ambientGlows.length > 0) {
    var parallaxSpeed = isMobile ? 0.5 : 1;
    var updateParallax = throttle(function () {
      var scrollY = window.pageYOffset;
      ambientGlows.forEach(function (glow, i) {
        var speed = (0.1 + (i * 0.05)) * parallaxSpeed;
        glow.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
      });
    }, 16);
    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // --- Mobile: Tap ripple on product cards ---
  if (isTouch) {
    var allProductCards = document.querySelectorAll('.product-card');
    allProductCards.forEach(function (card) {
      card.addEventListener('touchstart', function (e) {
        var rect = card.getBoundingClientRect();
        var t = e.touches[0];
        var x = t.clientX - rect.left;
        var y = t.clientY - rect.top;

        var ripple = document.createElement('span');
        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(224,92,42,0.25);pointer-events:none;' +
          'width:0;height:0;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);' +
          'animation:tapRipple 0.6s ease-out forwards;z-index:5;';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(ripple);

        setTimeout(function () {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 700);
      }, { passive: true });
    });
  }

})();

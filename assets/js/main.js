(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('themeToggle');
  function currentTheme() { return root.getAttribute('data-theme') === 'night' ? 'night' : 'day'; }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'day' ? 'night' : 'day';
    if (next === 'night') root.setAttribute('data-theme', 'night');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
    if (window.scrollY < 300) navLinks.forEach(function (a) { a.classList.remove('is-active'); });
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var menuBtn = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
  }
  menuBtn.addEventListener('click', function () { setMenu(mobileMenu.hidden); });
  mobileMenu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });

  /* ---------- Active section in nav ---------- */
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) sectionObs.observe(s);
    });
  }

  /* ---------- Reveal + count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduceMotion || isNaN(target)) return;
    var start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        el.querySelectorAll('[data-count]').forEach(countUp);
        revealObs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      revealObs.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Board gallery ---------- */
  var gallery = document.getElementById('boardGallery');
  if (gallery) {
    var main = gallery.querySelector('.board-gallery__main');
    var mainImg = main.querySelector('img');
    gallery.querySelectorAll('.board-gallery__thumbs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        gallery.querySelectorAll('.board-gallery__thumbs button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var src = btn.getAttribute('data-src');
        mainImg.style.opacity = '0';
        setTimeout(function () {
          mainImg.src = src;
          mainImg.alt = btn.getAttribute('aria-label');
          main.setAttribute('data-lightbox', src);
          main.setAttribute('data-caption', btn.getAttribute('data-caption'));
          mainImg.onload = function () { mainImg.style.opacity = '1'; };
          if (mainImg.complete) mainImg.style.opacity = '1';
        }, 180);
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('figcaption');
  var lastFocus = null;
  function openLightbox(src, caption) {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = caption || '';
    lbCap.textContent = caption || '';
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox__close').focus();
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 300);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lightbox]');
    if (!t) return;
    openLightbox(t.getAttribute('data-lightbox'), t.getAttribute('data-caption'));
  });
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) closeLightbox();
  });

  /* ---------- Year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Hero: wind-blown sand ----------
     Fine grains drift across the hero on a slow, gusting wind; a few streak like spice on the air. */
  var canvas = document.getElementById('ripples');
  if (!canvas || !canvas.getContext || reduceMotion) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, grains = [], rgb = '120,74,34', t = 0;

  function readColor() {
    var v = getComputedStyle(root).getPropertyValue('--dust').trim();
    if (v) rgb = v.replace(/\s+/g, '');
  }
  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(160, W * H / 9000));
    while (grains.length < target) grains.push(makeGrain(true));
    grains.length = target;
  }
  function makeGrain(anywhere) {
    // denser near the horizon, like sand lifting off the dune crests
    var y = H * (0.35 + Math.pow(Math.random(), 0.6) * 0.65);
    return {
      x: anywhere ? Math.random() * W : -20,
      y: y, base: y,
      r: 0.5 + Math.random() * 1.3,
      v: 0.25 + Math.random() * 0.9,
      a: 0.15 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2,
      streak: Math.random() < 0.12
    };
  }
  var running = true;
  function frame() {
    if (!running) return;
    t += 0.008;
    var gust = 1 + Math.sin(t) * 0.45 + Math.sin(t * 2.7) * 0.2;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];
      g.x += g.v * gust;
      g.y = g.base + Math.sin(g.ph + g.x * 0.01) * 6;
      if (g.x > W + 30) grains[i] = makeGrain(false);
      ctx.fillStyle = 'rgba(' + rgb + ',' + g.a + ')';
      if (g.streak) {
        ctx.fillRect(g.x - 14 * gust, g.y, 14 * gust, g.r * 0.7);
      } else {
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  readColor();
  resize();
  window.addEventListener('resize', resize);
  new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(canvas);
  }
  requestAnimationFrame(frame);
})();

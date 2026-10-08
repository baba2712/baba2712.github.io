(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var start = performance.now(), dur = 1800;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Board gallery ---------- */
  var gallery = document.getElementById('boardGallery');
  if (gallery) {
    var main = gallery.querySelector('.board-gallery__main');
    var mainImg = main.querySelector('img');
    var thumbs = gallery.querySelectorAll('.board-gallery__thumbs button');
    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        thumbs.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var src = btn.getAttribute('data-src');
        mainImg.style.opacity = '0';
        setTimeout(function () {
          mainImg.onload = function () { mainImg.style.opacity = '1'; };
          mainImg.src = src;
          mainImg.alt = btn.getAttribute('aria-label');
          main.setAttribute('data-lightbox', src);
          main.setAttribute('data-caption', btn.getAttribute('data-caption'));
          if (mainImg.complete) mainImg.style.opacity = '1';
        }, 220);
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
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 400);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lightbox]');
    if (t) openLightbox(t.getAttribute('data-lightbox'), t.getAttribute('data-caption'));
  });
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLightbox(); });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Opening frame: dust on the wind ----------
     Fine particles cross the frame on a slow, gusting wind, a few smeared into streaks. */
  var canvas = document.getElementById('dust');
  if (!canvas || !canvas.getContext || reduceMotion) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, grains = [], t = 0, running = true;

  function makeGrain(anywhere) {
    var y = H * Math.random();
    return {
      x: anywhere ? Math.random() * W : -30,
      y: y, base: y,
      r: 0.4 + Math.random() * 1.1,
      v: 0.3 + Math.random() * 1.1,
      a: 0.08 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      streak: Math.random() < 0.18
    };
  }
  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(220, W * H / 5000));
    while (grains.length < target) grains.push(makeGrain(true));
    grains.length = target;
  }
  function frame() {
    if (!running) return;
    t += 0.006;
    var gust = 1 + Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.25;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];
      g.x += g.v * gust;
      g.y = g.base + Math.sin(g.ph + g.x * 0.008) * 8;
      if (g.x > W + 40) grains[i] = makeGrain(false);
      ctx.fillStyle = 'rgba(92,66,40,' + g.a + ')';
      if (g.streak) ctx.fillRect(g.x - 18 * gust, g.y, 18 * gust, g.r * 0.6);
      else { ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill(); }
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(canvas);
  }
  requestAnimationFrame(frame);
})();

/* ==========================================================================
   TIVORA COUTURE — MAIN
   Runs on every page: mounts header/footer, wires scroll reveals, the
   cinematic hero parallax (homepage only), and the newsletter form.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (window.TivoraComponents) window.TivoraComponents.mount();
    initRevealOnScroll();
    initHeroParallax();
    initNewsletterForm();
  });

  /* ---- Reveal-on-scroll: add .reveal to any element, it fades/rises once in view ---- */
  function initRevealOnScroll() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---- Hero parallax: layered images drift at different speeds while
     the hero is in view. Uses requestAnimationFrame and a passive scroll
     listener; disabled entirely for reduced-motion users. ---- */
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const layers = hero.querySelectorAll('.hero-layer[data-speed]');
    if (!layers.length) return;

    let ticking = false;
    function update() {
      const rect = hero.getBoundingClientRect();
      // Only animate while the hero is at least partly in the viewport.
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const progress = -rect.top; // px scrolled past hero top
        layers.forEach(layer => {
          const speed = parseFloat(layer.dataset.speed) || 0.15;
          layer.style.transform = `translate3d(0, ${progress * speed}px, 0)`;
        });
      }
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---- Newsletter subscribe form (present on the homepage before the footer) ----
     Stores the intent client-side and shows a confirmation. Wire this to a
     Netlify Function + Firestore + Resend once the backend is connected. */
  function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = document.getElementById('newsletterMsg');
      const email = input.value.trim();
      if (!email) return;

      // TODO: POST to /.netlify/functions/subscribe-newsletter once deployed.
      // fetch('/.netlify/functions/subscribe-newsletter', { method: 'POST', body: JSON.stringify({ email }) })

      if (msg) msg.textContent = 'Welcome to the world of Tivora — check your inbox shortly.';
      input.value = '';
    });
  }
})();

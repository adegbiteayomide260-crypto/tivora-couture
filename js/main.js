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
  }  /* ---- PWA service worker ---- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Tivora service worker registered'))
        .catch(err => console.warn('Tivora service worker registration failed:', err));
    });
  }
  /* ---- PWA install prompt ---- */
  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    if (document.getElementById('tivoraInstallPrompt')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const banner = document.createElement('div');
    banner.id = 'tivoraInstallPrompt';
    banner.innerHTML = `
      <div class="tivora-install-content">
        <div>
          <strong>Install Tivora Couture</strong>
          <span>Get the full app-like shopping experience.</span>
        </div>
        <div class="tivora-install-actions">
          <button type="button" id="tivoraInstallBtn">Install App</button>
          <button type="button" id="tivoraInstallDismiss">Not now</button>
        </div>
      </div>
    `;

    Object.assign(banner.style, {
      position: 'fixed',
      left: '16px',
      right: '16px',
      bottom: '16px',
      zIndex: '99999',
      background: '#3d0a19',
      color: '#f5ede0',
      padding: '16px 18px',
      borderRadius: '14px',
      boxShadow: '0 12px 35px rgba(0,0,0,.25)',
      fontFamily: 'Jost, sans-serif'
    });

    const content = banner.querySelector('.tivora-install-content');
    Object.assign(content.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '18px',
      flexWrap: 'wrap'
    });

    const title = banner.querySelector('strong');
    const subtitle = banner.querySelector('span');

    Object.assign(title.style, {
      display: 'block',
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '20px'
    });

    Object.assign(subtitle.style, {
      display: 'block',
      marginTop: '3px',
      fontSize: '13px',
      opacity: '.85'
    });

    const actions = banner.querySelector('.tivora-install-actions');
    Object.assign(actions.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });

    const installBtn = banner.querySelector('#tivoraInstallBtn');
    Object.assign(installBtn.style, {
      border: '0',
      borderRadius: '999px',
      padding: '11px 18px',
      background: '#c39a4f',
      color: '#3d0a19',
      fontWeight: '700',
      cursor: 'pointer'
    });

    const dismissBtn = banner.querySelector('#tivoraInstallDismiss');
    Object.assign(dismissBtn.style, {
      border: '0',
      background: 'transparent',
      color: '#f5ede0',
      padding: '10px',
      cursor: 'pointer'
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;

      if (result.outcome === 'accepted') {
        banner.remove();
      }

      deferredInstallPrompt = null;
    });

    dismissBtn.addEventListener('click', () => {
      banner.remove();
    });

    document.body.appendChild(banner);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const banner = document.getElementById('tivoraInstallPrompt');
    if (banner) banner.remove();
  });

})();

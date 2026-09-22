/* ==========================================================================
   TIVORA COUTURE — SHARED COMPONENTS
   Header, footer, mobile menu, toast notifications, and the WhatsApp float.
   Every page includes this file and calls TivoraComponents.mount() so the
   header/footer only need to be edited in one place.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ---- Real brand contact details (from brand reference) — do not invent ---- */
  const BRAND = {
    name: 'Tivora Couture',
    tagline: 'Designed to be timeless. Worn to be remembered.',
    whatsapp: '2349156304383', // primary line, international format for wa.me links
    phones: ['09156304383', '07018937394'],
    // Email/social handles are not yet supplied — wired through Settings once provided.
    email: '',
    instagram: '',
    tiktok: '',
    facebook: ''
  };
  global.TIVORA_BRAND = BRAND;

  const NAV_LINKS = [
    { label: 'Shop', href: 'shop.html' },
    { label: 'Custom Couture', href: 'custom-couture.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Size Guide', href: 'size-guide.html' },
    { label: 'Contact', href: 'contact.html' }
  ];

  function currentPage() {
    const path = global.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function headerTemplate() {
    const page = currentPage();
    const links = NAV_LINKS.map(l =>
      `<li><a href="${l.href}" class="${page === l.href ? 'active' : ''}">${l.label}</a></li>`
    ).join('');
    const mobileLinks = NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('');

    return `
    <header class="site-header" id="siteHeader">
      <div class="container">
        <a href="index.html" class="brand-mark" aria-label="Tivora Couture home">
          <span class="brand-script">Tivora</span>
          <span class="brand-sub">COUTURE</span>
        </a>
        <nav class="main-nav" aria-label="Primary">
          <ul>${links}</ul>
        </nav>
        <div class="header-actions">
          <a href="wishlist.html" aria-label="Wishlist">
            ${icon('heart')}
            <span class="icon-badge" id="wishlistBadge"></span>
          </a>
          <a href="cart.html" aria-label="Cart">
            ${icon('bag')}
            <span class="icon-badge" id="cartBadge"></span>
          </a>
          <button type="button" class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Site menu">
      <div class="mobile-menu-top">
        <span class="brand-mark"><span class="brand-script">Tivora</span></span>
        <button type="button" class="mobile-menu-close" id="mobileMenuClose">CLOSE ✕</button>
      </div>
      <nav aria-label="Mobile">${mobileLinks}</nav>
      <div class="mobile-menu-footer">
        <a href="wishlist.html">Wishlist</a>
        <a href="cart.html">Cart</a>
        <a href="track-order.html">Track Order</a>
        <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">WhatsApp Us</a>
      </div>
    </div>`;
  }

  function footerTemplate() {
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="brand-mark"><span class="brand-script">Tivora</span><span class="brand-sub">COUTURE</span></div>
            <p>${BRAND.tagline}</p>
            <div class="footer-social" aria-label="Social links">
              <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
              ${BRAND.instagram ? `<a href="${BRAND.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>` : ''}
              ${BRAND.tiktok ? `<a href="${BRAND.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">${icon('tiktok')}</a>` : ''}
              ${BRAND.facebook ? `<a href="${BRAND.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>` : ''}
            </div>
          </div>
          <div class="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="shop.html">All Pieces</a></li>
              <li><a href="wishlist.html">Wishlist</a></li>
              <li><a href="cart.html">Cart</a></li>
              <li><a href="track-order.html">Track Order</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>The House</h4>
            <ul>
              <li><a href="about.html">About</a></li>
              <li><a href="about.html#ceo">The Founder</a></li>
              <li><a href="size-guide.html">Size Guide</a></li>
              <li><a href="custom-couture.html">Custom Couture</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="tel:${BRAND.phones[0]}">${BRAND.phones[0]}</a></li>
              <li><a href="tel:${BRAND.phones[1]}">${BRAND.phones[1]}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© <span id="footerYear"></span> Tivora Couture. All rights reserved.</span>
          <span>Crafted with care, for those who wear their story.</span>
        </div>
      </div>
    </footer>
    <a class="whatsapp-float" href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
      ${icon('whatsapp')}
    </a>
    <div class="toast-stack" id="toastStack" aria-live="polite"></div>`;
  }

  function icon(name) {
    const icons = {
      heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4.5 5.5 4a5 5 0 0 1 6.5 3 5 5 0 0 1 6.5-3C22 4.5 23.5 8 21.5 11.5 19 15.65 12 20 12 20Z"/></svg>',
      bag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5C10.1 9 9.7 8 9.5 7.5c-.1-.4-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4ZM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.4 2.3 2 3.8 4.3 4v3c-1.6.1-3-.4-4.3-1.3v6.4a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.1v3.1a2.4 2.4 0 1 0 1.7 2.3V3h2.8Z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5H16.5V4.2C16.2 4.2 15.2 4 14 4c-2.4 0-4 1.5-4 4.1V10.5H7.5v3H10V21h3.5Z"/></svg>'
    };
    return icons[name] || '';
  }

  function mountHeaderFooter() {
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.outerHTML = headerTemplate();
    if (footerSlot) footerSlot.outerHTML = footerTemplate();

    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    wireHeaderBehaviour();
    refreshBadges();
  }

  function wireHeaderBehaviour() {
    const header = document.getElementById('siteHeader');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    const close = document.getElementById('mobileMenuClose');

    const solidPages = ['shop.html', 'product.html', 'cart.html', 'wishlist.html', 'checkout.html',
      'custom-couture.html', 'about.html', 'size-guide.html', 'contact.html', 'track-order.html'];
    if (header && solidPages.includes(currentPage())) header.classList.add('solid');

    function onScroll() {
      if (!header) return;
      if (global.scrollY > 40) header.classList.add('is-scrolled');
      else if (!header.classList.contains('solid')) header.classList.remove('is-scrolled');
    }
    global.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    if (toggle) toggle.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (menu) menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ---- Cart / wishlist badge counts, read from localStorage (see cart.js / wishlist.js) ---- */
  function refreshBadges() {
    const cartBadge = document.getElementById('cartBadge');
    const wishBadge = document.getElementById('wishlistBadge');
    if (cartBadge) cartBadge.textContent = global.TivoraCart ? global.TivoraCart.count() : 0;
    if (wishBadge) wishBadge.textContent = global.TivoraWishlist ? global.TivoraWishlist.count() : 0;
  }
  global.addEventListener('tivora:cart-updated', refreshBadges);
  global.addEventListener('tivora:wishlist-updated', refreshBadges);

  /* ---- Toast notifications ---- */
  function toast(message, tone) {
    const stack = document.getElementById('toastStack');
    if (!stack) { console.log('[Tivora]', message); return; }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  global.TivoraComponents = { mount: mountHeaderFooter, refreshBadges, toast, icon };
})(window);

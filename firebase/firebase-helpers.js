/* ==========================================================================
   TIVORA COUTURE — SHARED HELPERS
   Pure functions used by both the storefront and the admin app: currency
   formatting, product filtering/sorting, and WhatsApp deep-link building.
   Kept dependency-free so it can be loaded on any page.
   ========================================================================== */

(function (global) {
  'use strict';

  function formatNaira(amount) {
    const n = Number(amount) || 0;
    return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 });
  }

  function applyProductFilters(items, filters) {
    let out = items.slice();
    if (filters.category) out = out.filter(p => p.category === filters.category);
    if (filters.availability) out = out.filter(p => p.availability === filters.availability);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      out = out.filter(p => (p.name || '').toLowerCase().includes(q));
    }
    if (filters.minPrice != null) out = out.filter(p => p.price >= filters.minPrice);
    if (filters.maxPrice != null) out = out.filter(p => p.price <= filters.maxPrice);
    switch (filters.sort) {
      case 'price-asc': out.sort((a, b) => a.price - b.price); break;
      case 'price-desc': out.sort((a, b) => b.price - a.price); break;
      case 'newest': out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
      default: break;
    }
    return out;
  }

  function waLink(phoneE164, message) {
    return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
  }

  function generateOrderNumber() {
    const now = new Date();
    const stamp = now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TC-${stamp}-${rand}`;
  }

  global.TivoraHelpers = { formatNaira, applyProductFilters, waLink, generateOrderNumber };
})(window);

/* ==========================================================================
   TIVORA COUTURE — WISHLIST MODULE
   localStorage-backed wishlist, shared by every page.
   Item shape: { id, name, price, image }
   ========================================================================== */

(function (global) {
  'use strict';
  const KEY = 'tivora_wishlist_v1';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    global.dispatchEvent(new CustomEvent('tivora:wishlist-updated', { detail: items }));
  }
  function has(id) { return read().some(i => i.id === id); }
  function toggle(item) {
    const items = read();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx > -1) { items.splice(idx, 1); write(items); return false; }
    items.push(item); write(items); return true;
  }
  function remove(id) { write(read().filter(i => i.id !== id)); }
  function all() { return read(); }
  function count() { return read().length; }

  global.TivoraWishlist = { has, toggle, remove, all, count };

  /* ---- Wishlist page rendering (only runs where #wishlistGrid exists) ---- */
  document.addEventListener('DOMContentLoaded', renderWishlistPage);
  global.addEventListener('tivora:wishlist-updated', renderWishlistPage);

  function renderWishlistPage() {
    const grid = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('wishlistEmpty');
    if (!grid) return;

    const items = read();
    if (!items.length) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    const fmt = global.TivoraHelpers.formatNaira;
    grid.innerHTML = items.map(item => `
      <article class="product-card">
        <a href="product.html?id=${item.id}" class="thumb"><img src="${item.image}" alt="${item.name}" loading="lazy"></a>
        <button type="button" class="wishlist-toggle active" data-id="${item.id}" aria-label="Remove from wishlist">
          ${global.TivoraComponents.icon('heart')}
        </button>
        <a href="product.html?id=${item.id}" class="info">
          <span class="name">${item.name}</span>
          <span class="price">${fmt(item.price)}</span>
        </a>
        <button type="button" class="add-cart" data-action="move" data-id="${item.id}">Move to Cart</button>
      </article>`).join('');

    grid.querySelectorAll('[data-id]').forEach(btn => {
      const id = btn.dataset.id;
      const item = items.find(i => i.id === id);
      if (btn.classList.contains('wishlist-toggle')) {
        btn.addEventListener('click', () => { remove(id); global.TivoraComponents.toast('Removed from wishlist'); });
      } else {
        btn.addEventListener('click', () => {
          global.TivoraCart.add({ id: item.id, name: item.name, price: item.price, image: item.image, qty: 1 });
          remove(id);
          global.TivoraComponents.toast(`${item.name} moved to cart`);
        });
      }
    });
  }
})(window);

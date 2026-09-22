/* ==========================================================================
   TIVORA COUTURE — CART MODULE
   localStorage-backed cart, shared by every page via <script src="js/cart.js">.
   Line item shape: { id, name, price, image, size, color, qty }
   ========================================================================== */

(function (global) {
  'use strict';
  const KEY = 'tivora_cart_v1';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    global.dispatchEvent(new CustomEvent('tivora:cart-updated', { detail: items }));
  }
  function lineKey(item) { return [item.id, item.size || '', item.color || ''].join('::'); }

  function add(item) {
    const items = read();
    const key = lineKey(item);
    const existing = items.find(i => lineKey(i) === key);
    if (existing) existing.qty += item.qty || 1;
    else items.push(Object.assign({ qty: 1 }, item));
    write(items);
  }
  function updateQty(id, size, color, qty) {
    const items = read();
    const key = lineKey({ id, size, color });
    const target = items.find(i => lineKey(i) === key);
    if (!target) return;
    target.qty = Math.max(1, qty);
    write(items);
  }
  function remove(id, size, color) {
    const items = read().filter(i => lineKey(i) !== lineKey({ id, size, color }));
    write(items);
  }
  function clear() { write([]); }
  function all() { return read(); }
  function count() { return read().reduce((sum, i) => sum + i.qty, 0); }
  function subtotal() { return read().reduce((sum, i) => sum + i.qty * i.price, 0); }

  global.TivoraCart = { add, updateQty, remove, clear, all, count, subtotal };

  /* ---- Cart page rendering (only runs where #cartList exists, e.g. cart.html) ---- */
  document.addEventListener('DOMContentLoaded', renderCartPage);
  global.addEventListener('tivora:cart-updated', renderCartPage);

  function renderCartPage() {
    const list = document.getElementById('cartList');
    const emptyState = document.getElementById('cartEmpty');
    const summary = document.getElementById('cartSummary');
    if (!list) return;

    const items = read();
    if (!items.length) {
      list.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }
    if (emptyState) emptyState.hidden = true;
    if (summary) summary.hidden = false;

    const fmt = global.TivoraHelpers.formatNaira;
    list.innerHTML = items.map(item => `
      <div class="cart-row" data-key="${item.id}|${item.size || ''}|${item.color || ''}">
        <img src="${item.image}" alt="${item.name}" class="cart-row-img">
        <div class="cart-row-info">
          <span class="name">${item.name}</span>
          <span class="muted">${[item.size, item.color].filter(Boolean).join(' · ')}</span>
          <span class="price">${fmt(item.price)}</span>
        </div>
        <div class="qty-control">
          <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
          <input type="number" min="1" value="${item.qty}" data-action="qty" aria-label="Quantity">
          <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
        </div>
        <span class="line-total">${fmt(item.price * item.qty)}</span>
        <button type="button" class="remove-btn" data-action="remove" aria-label="Remove item">✕</button>
      </div>`).join('');

    list.querySelectorAll('.cart-row').forEach(row => {
      const [id, size, color] = row.dataset.key.split('|');
      const item = items.find(i => i.id === id && (i.size || '') === size && (i.color || '') === color);
      row.querySelector('[data-action="inc"]').addEventListener('click', () => updateQty(id, size, color, item.qty + 1));
      row.querySelector('[data-action="dec"]').addEventListener('click', () => updateQty(id, size, color, item.qty - 1));
      row.querySelector('[data-action="qty"]').addEventListener('change', e => updateQty(id, size, color, Number(e.target.value) || 1));
      row.querySelector('[data-action="remove"]').addEventListener('click', () => remove(id, size, color));
    });

    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal());
  }
})(window);

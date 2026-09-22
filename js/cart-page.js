/* ==========================================================================
   TIVORA COUTURE — CART PAGE RENDERER
   (Named cart-page.js so it doesn't collide with the shared cart.js module,
   which is loaded on every page.)
   ========================================================================== */

(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('tivora:cart-updated', render);

  function render() {
    const list = document.getElementById('cartList');
    const empty = document.getElementById('cartEmpty');
    const summary = document.getElementById('cartSummary');
    if (!list) return;

    const items = window.TivoraCart.all();
    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (summary) summary.hidden = false;

    list.innerHTML = items.map(item => `
      <div class="cart-row" data-key="${item.id}|${item.size || ''}|${item.color || ''}">
        <img src="${item.image}" alt="${item.name}" class="cart-row-img">
        <div class="cart-row-info">
          <span class="name">${item.name}</span>
          <span class="muted">${[item.size, item.color].filter(Boolean).join(' · ')}</span>
          <span class="price">${window.TivoraHelpers.formatNaira(item.price)}</span>
        </div>
        <div class="qty-control">
          <button type="button" data-action="dec">−</button>
          <input type="number" min="1" value="${item.qty}" data-action="qty">
          <button type="button" data-action="inc">+</button>
        </div>
        <span class="line-total">${window.TivoraHelpers.formatNaira(item.price * item.qty)}</span>
        <button type="button" class="remove-btn" data-action="remove" aria-label="Remove">✕</button>
      </div>`).join('');

    list.querySelectorAll('.cart-row').forEach(row => {
      const [id, size, color] = row.dataset.key.split('|');
      const item = items.find(i => i.id === id && (i.size || '') === size && (i.color || '') === color);
      row.querySelector('[data-action="inc"]').addEventListener('click', () => window.TivoraCart.updateQty(id, size, color, item.qty + 1));
      row.querySelector('[data-action="dec"]').addEventListener('click', () => window.TivoraCart.updateQty(id, size, color, item.qty - 1));
      row.querySelector('[data-action="qty"]').addEventListener('change', e => window.TivoraCart.updateQty(id, size, color, Number(e.target.value) || 1));
      row.querySelector('[data-action="remove"]').addEventListener('click', () => window.TivoraCart.remove(id, size, color));
    });

    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = window.TivoraHelpers.formatNaira(window.TivoraCart.subtotal());
  }
})();

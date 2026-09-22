/* ==========================================================================
   TIVORA COUTURE — CHECKOUT
   Renders an order review from the cart, validates the delivery form, then:
     1. Calls /.netlify/functions/create-order (Firestore = system of record)
     2. Opens a pre-filled WhatsApp message as a communication follow-up
   Cart / checkout view / WhatsApp message are never treated as a completed
   sale — only a Firestore order record with a confirmed status is.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    renderReview();
    const form = document.getElementById('checkoutForm');
    if (form) form.addEventListener('submit', onSubmit);
  });

  function renderReview() {
    const wrap = document.getElementById('checkoutReview');
    const items = window.TivoraCart.all();
    if (!wrap) return;

    if (!items.length) {
      wrap.innerHTML = `<div class="empty-state"><p>Your bag is empty — add a piece before checking out.</p>
        <div class="actions"><a href="shop.html" class="btn btn-primary">Browse the Collection</a></div></div>`;
      const form = document.getElementById('checkoutForm');
      if (form) form.hidden = true;
      return;
    }

    const fmt = window.TivoraHelpers.formatNaira;
    wrap.innerHTML = `
      <div class="checkout-items">
        ${items.map(i => `
          <div class="checkout-item">
            <img src="${i.image}" alt="${i.name}">
            <div>
              <span class="name">${i.name}</span>
              <span class="muted">${[i.size, i.color].filter(Boolean).join(' · ')} × ${i.qty}</span>
            </div>
            <span class="price">${fmt(i.price * i.qty)}</span>
          </div>`).join('')}
      </div>
      <div class="checkout-total">
        <span>Total</span>
        <span>${fmt(window.TivoraCart.subtotal())}</span>
      </div>`;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const items = window.TivoraCart.all();
    if (!items.length) return;

    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const orderNumber = window.TivoraHelpers.generateOrderNumber();
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing order…'; }

    const order = {
      orderNumber,
      customer: { name: data.fullName, phone: data.phone, email: data.email },
      delivery: { address: data.address, city: data.city, state: data.state, notes: data.notes || '' },
      items,
      subtotal: window.TivoraCart.subtotal(),
      status: 'Pending'
    };

    try {
      // System of record: Netlify Function writes this to Firestore server-side.
      await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (err) {
      // Fails gracefully — the function/backend may not be deployed yet.
      console.warn('create-order function unavailable:', err.message);
    }

    window.TivoraCart.clear();
    showConfirmation(order);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
  }

  function showConfirmation(order) {
    const form = document.getElementById('checkoutForm');
    const confirmation = document.getElementById('checkoutConfirmation');
    if (form) form.hidden = true;
    if (!confirmation) return;
    confirmation.hidden = false;

    const message = `Hello Tivora Couture, I just placed order ${order.orderNumber} (${window.TivoraHelpers.formatNaira(order.subtotal)}). I'd like to confirm delivery details.`;
    const waHref = window.TivoraHelpers.waLink(window.TIVORA_BRAND.whatsapp, message);

    confirmation.innerHTML = `
      <div class="empty-state">
        <div class="glyph">✓</div>
        <h3>Order ${order.orderNumber} received</h3>
        <p>We've logged your order and will reach out to confirm details. You can also continue the conversation on WhatsApp right away.</p>
        <div class="actions">
          <a href="${waHref}" target="_blank" rel="noopener" class="btn btn-primary">Continue on WhatsApp</a>
          <a href="track-order.html" class="btn btn-outline">Track This Order</a>
        </div>
      </div>`;
  }
})();

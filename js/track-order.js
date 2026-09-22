/* ==========================================================================
   TIVORA COUTURE — TRACK ORDER
   Looks up an order by order number + phone (never exposes other customers'
   data — the Netlify Function / Firestore query filters strictly by both
   values together). Shows status and a "Continue on WhatsApp" handoff.
   ========================================================================== */

(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('trackForm');
    if (form) form.addEventListener('submit', onSubmit);
  });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const resultWrap = document.getElementById('trackResult');
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Searching…'; }

    let order = null;
    try {
      const res = await fetch(`/.netlify/functions/track-order?orderNumber=${encodeURIComponent(data.orderNumber)}&phone=${encodeURIComponent(data.phone)}`);
      if (res.ok) order = await res.json();
    } catch (err) {
      try { order = window.TivoraFirestore ? await window.TivoraFirestore.getOrderByLookup(data.orderNumber, data.phone) : null; }
      catch (e2) { order = null; }
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Track Order'; }
    if (!resultWrap) return;
    resultWrap.hidden = false;

    if (!order) {
      resultWrap.innerHTML = `<div class="empty-state">
        <p>We couldn't find an order matching that number and phone. Double-check the details or reach us on WhatsApp.</p>
        <div class="actions"><a href="https://wa.me/${window.TIVORA_BRAND.whatsapp}" target="_blank" rel="noopener" class="btn btn-primary">Chat on WhatsApp</a></div>
      </div>`;
      return;
    }

    const message = `Hello Tivora Couture, following up on order ${order.orderNumber} — currently marked "${order.status}".`;
    const waHref = window.TivoraHelpers.waLink(window.TIVORA_BRAND.whatsapp, message);
    resultWrap.innerHTML = `
      <div class="order-status-card">
        <span class="eyebrow">Order ${order.orderNumber}</span>
        <h3>${order.status}</h3>
        <p class="muted">Placed for ${order.customer?.name || 'you'} · ${window.TivoraHelpers.formatNaira(order.subtotal || 0)}</p>
        <div class="actions">
          <a href="${waHref}" target="_blank" rel="noopener" class="btn btn-primary">Continue on WhatsApp</a>
        </div>
      </div>`;
  }
})();

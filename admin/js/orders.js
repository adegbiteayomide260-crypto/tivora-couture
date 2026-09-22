/* ==========================================================================
   TIVORA COUTURE ADMIN — ORDERS
   Lists orders with customer/delivery/product detail and lets the admin
   move an order through its lifecycle: Pending → Confirmed → Processing →
   Ready → Completed (or Cancelled at any point).
   ========================================================================== */

(function () {
  'use strict';
  const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled'];
  let orders = [];

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    try {
      orders = await window.TivoraFirestore.adminGetOrders();
    } catch (err) {
      console.warn('Could not load orders:', err.message);
      orders = [];
    }
    render();
  }

  function render() {
    const tbody = document.querySelector('#ordersTable tbody');
    const empty = document.getElementById('ordersEmpty');
    if (!tbody) return;
    if (!orders.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    const fmt = window.TivoraHelpers.formatNaira;

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.orderNumber || o.id}</td>
        <td>${o.customer?.name || '—'}<br><span class="muted" style="font-size:0.78rem;">${o.customer?.phone || ''}</span></td>
        <td>${(o.items || []).length} item(s)</td>
        <td>${fmt(o.subtotal || 0)}</td>
        <td>
          <select data-status="${o.id}">
            ${STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><button type="button" class="admin-btn outline" data-details="${o.id}">Details</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', () => onStatusChange(sel.dataset.status, sel.value)));
    tbody.querySelectorAll('[data-details]').forEach(btn => btn.addEventListener('click', () => showDetails(btn.dataset.details)));
  }

  async function onStatusChange(id, status) {
    try {
      await window.TivoraFirestore.adminUpdateOrderStatus(id, status);
      const order = orders.find(o => o.id === id);
      if (order) order.status = status;
    } catch (err) {
      alert('Could not update order status: ' + err.message);
    }
  }

  function showDetails(id) {
    const order = orders.find(o => o.id === id);
    const panel = document.getElementById('orderDetailsPanel');
    if (!order || !panel) return;
    const fmt = window.TivoraHelpers.formatNaira;
    panel.hidden = false;
    panel.innerHTML = `
      <h2>Order ${order.orderNumber || order.id}</h2>
      <p><strong>Customer:</strong> ${order.customer?.name || '—'} · ${order.customer?.phone || ''} · ${order.customer?.email || ''}</p>
      <p><strong>Delivery:</strong> ${order.delivery?.address || ''}, ${order.delivery?.city || ''}, ${order.delivery?.state || ''}</p>
      ${order.delivery?.notes ? `<p><strong>Notes:</strong> ${order.delivery.notes}</p>` : ''}
      <table class="admin-table" style="margin-top:1rem;">
        <thead><tr><th>Item</th><th>Size / Color</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>
          ${(order.items || []).map(i => `<tr><td>${i.name}</td><td>${[i.size, i.color].filter(Boolean).join(' · ') || '—'}</td><td>${i.qty}</td><td>${fmt(i.price)}</td></tr>`).join('')}
        </tbody>
      </table>
      <p style="margin-top:1rem; font-size:1.1rem;"><strong>Total: ${fmt(order.subtotal || 0)}</strong></p>
      <button type="button" class="admin-btn outline" id="closeOrderDetails">Close</button>
    `;
    document.getElementById('closeOrderDetails').addEventListener('click', () => panel.hidden = true);
    panel.scrollIntoView({ behavior: 'smooth' });
  }
})();

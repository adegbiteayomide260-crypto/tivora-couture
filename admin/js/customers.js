/* ==========================================================================
   TIVORA COUTURE ADMIN — CUSTOMERS
   There's no separate "customers" collection — this view derives a
   customer list from legitimately collected order + enquiry data, grouped
   by phone number, so we only ever show what customers have already given
   us through a real interaction with the store.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    let orders = [], enquiries = [];
    try {
      [orders, enquiries] = await Promise.all([
        window.TivoraFirestore.adminGetOrders(),
        window.TivoraFirestore.adminGetEnquiries()
      ]);
    } catch (err) {
      console.warn('Could not load customer data:', err.message);
    }
    render(buildCustomers(orders, enquiries));
  }

  function buildCustomers(orders, enquiries) {
    const map = new Map();
    orders.forEach(o => {
      const phone = o.customer?.phone;
      if (!phone) return;
      const entry = map.get(phone) || { name: o.customer.name, phone, email: o.customer.email, orders: 0, spend: 0 };
      entry.orders += 1;
      if (o.status === 'Confirmed' || o.status === 'Completed') entry.spend += (o.subtotal || 0);
      map.set(phone, entry);
    });
    enquiries.forEach(e => {
      const phone = e.phone;
      if (!phone) return;
      const entry = map.get(phone) || { name: e.name, phone, email: e.email, orders: 0, spend: 0 };
      map.set(phone, entry);
    });
    return Array.from(map.values());
  }

  function render(customers) {
    const tbody = document.querySelector('#customersTable tbody');
    const empty = document.getElementById('customersEmpty');
    if (!tbody) return;
    if (!customers.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    const fmt = window.TivoraHelpers.formatNaira;
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td>${c.name || '—'}</td>
        <td>${c.phone}</td>
        <td>${c.email || '—'}</td>
        <td>${c.orders}</td>
        <td>${fmt(c.spend)}</td>
        <td><a href="https://wa.me/${(c.phone || '').replace(/\D/g, '')}" target="_blank" rel="noopener" class="admin-btn outline">WhatsApp</a></td>
      </tr>`).join('');
  }
})();

/* ==========================================================================
   TIVORA COUTURE ADMIN — DASHBOARD
   Pulls products + orders + custom couture requests from Firestore (admin
   read, enforced by firestore.rules) and renders stat cards and recent
   activity tables. "Total amount sold" is summed only from orders whose
   status is Confirmed or Completed — never from carts, pending orders, or
   custom couture requests.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', async (e) => {
    const el = document.getElementById('adminWelcome');
    if (el) el.textContent = e.detail.email || '';
    await load();
  });

  async function load() {
    let products = [], orders = [], couture = [];
    try {
      [products, orders, couture] = await Promise.all([
        window.TivoraFirestore.adminGetAllProducts(),
        window.TivoraFirestore.adminGetOrders(),
        window.TivoraFirestore.adminGetCustomCoutureRequests()
      ]);
    } catch (err) {
      console.warn('Dashboard data unavailable:', err.message);
    }
    renderStats(products, orders, couture);
    renderRecentOrders(orders.slice(0, 6));
    renderRecentCouture(couture.slice(0, 6));
  }

  function renderStats(products, orders, couture) {
    const grid = document.getElementById('statGrid');
    if (!grid) return;

    const totalProducts = products.length;
    const onlineProducts = products.filter(p => p.availability !== 'out-of-stock' && p.status !== 'hidden').length;
    const outOfStock = products.filter(p => p.availability === 'out-of-stock').length;

    const byStatus = (s) => orders.filter(o => o.status === s).length;
    const pending = byStatus('Pending');
    const confirmed = byStatus('Confirmed');
    const processing = byStatus('Processing');
    const completed = byStatus('Completed');
    const cancelled = byStatus('Cancelled');

    const confirmedSales = orders.filter(o => o.status === 'Confirmed').reduce((s, o) => s + (o.subtotal || 0), 0);
    const completedSales = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + (o.subtotal || 0), 0);

    const fmt = window.TivoraHelpers ? window.TivoraHelpers.formatNaira : (n) => `₦${n}`;

    const stats = [
      { label: 'Total Products', value: totalProducts },
      { label: 'Products Online', value: onlineProducts },
      { label: 'Out of Stock', value: outOfStock },
      { label: 'Total Orders', value: orders.length },
      { label: 'Pending Orders', value: pending },
      { label: 'Confirmed Orders', value: confirmed },
      { label: 'Processing Orders', value: processing },
      { label: 'Completed Orders', value: completed },
      { label: 'Cancelled Orders', value: cancelled },
      { label: 'Confirmed Sales', value: fmt(confirmedSales) },
      { label: 'Completed Sales', value: fmt(completedSales) },
      { label: 'Custom Couture Requests', value: couture.length }
    ];

    grid.innerHTML = stats.map(s => `
      <div class="stat-card"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>
    `).join('');
  }

  function renderRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    const empty = document.getElementById('recentOrdersEmpty');
    if (!tbody) return;
    if (!orders.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    const fmt = window.TivoraHelpers.formatNaira;
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.orderNumber || o.id}</td>
        <td>${o.customer?.name || '—'}</td>
        <td>${fmt(o.subtotal || 0)}</td>
        <td><span class="status-chip ${String(o.status || '').toLowerCase()}">${o.status || 'Pending'}</span></td>
        <td>${formatDate(o.createdAt)}</td>
      </tr>`).join('');
  }

  function renderRecentCouture(items) {
    const tbody = document.querySelector('#recentCoutureTable tbody');
    const empty = document.getElementById('recentCoutureEmpty');
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    tbody.innerHTML = items.map(r => `
      <tr>
        <td>${r.name || '—'}</td>
        <td>${r.eventType || '—'}</td>
        <td><span class="status-chip">${r.status || 'new'}</span></td>
        <td>${formatDate(r.createdAt)}</td>
      </tr>`).join('');
  }

  function formatDate(ts) {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();

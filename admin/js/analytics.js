/* ==========================================================================
   TIVORA COUTURE ADMIN — ANALYTICS
   Recomputes the same real metrics as the dashboard, framed as a slightly
   deeper analytics view. No fabricated statistics — every number here
   comes straight from Firestore, with a zero state when there's no data.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    let products = [], orders = [], couture = [], enquiries = [], subscribers = [];
    try {
      [products, orders, couture, enquiries, subscribers] = await Promise.all([
        window.TivoraFirestore.adminGetAllProducts(),
        window.TivoraFirestore.adminGetOrders(),
        window.TivoraFirestore.adminGetCustomCoutureRequests(),
        window.TivoraFirestore.adminGetEnquiries(),
        window.TivoraFirestore.adminGetNewsletterSubscribers()
      ]);
    } catch (err) {
      console.warn('Analytics data unavailable:', err.message);
    }
    render(products, orders, couture, enquiries, subscribers);
  }

  function render(products, orders, couture, enquiries, subscribers) {
    const fmt = window.TivoraHelpers.formatNaira;
    const revenue = orders.filter(o => o.status === 'Confirmed' || o.status === 'Completed')
      .reduce((s, o) => s + (o.subtotal || 0), 0);

    const stats = [
      { label: 'Total Revenue (Confirmed + Completed)', value: fmt(revenue) },
      { label: 'Completed Orders', value: orders.filter(o => o.status === 'Completed').length },
      { label: 'Confirmed Orders', value: orders.filter(o => o.status === 'Confirmed').length },
      { label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length },
      { label: 'Products Online', value: products.filter(p => p.availability !== 'out-of-stock').length },
      { label: 'Products Out of Stock', value: products.filter(p => p.availability === 'out-of-stock').length },
      { label: 'Custom Couture Requests', value: couture.length },
      { label: 'Enquiries', value: enquiries.length },
      { label: 'Newsletter Subscribers', value: subscribers.length }
    ];

    const grid = document.getElementById('analyticsGrid');
    if (grid) grid.innerHTML = stats.map(s => `<div class="stat-card"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`).join('');

    const recentWrap = document.getElementById('recentActivity');
    const emptyWrap = document.getElementById('recentActivityEmpty');
    if (!recentWrap) return;
    const activity = [
      ...orders.map(o => ({ type: 'Order', text: `${o.orderNumber || o.id} — ${o.status}`, at: o.createdAt })),
      ...couture.map(c => ({ type: 'Custom Request', text: `${c.name || 'Unknown'} — ${c.status || 'new'}`, at: c.createdAt })),
      ...enquiries.map(e => ({ type: 'Enquiry', text: `${e.name || 'Unknown'}`, at: e.createdAt }))
    ].sort((a, b) => toMillis(b.at) - toMillis(a.at)).slice(0, 10);

    if (!activity.length) { recentWrap.innerHTML = ''; if (emptyWrap) emptyWrap.hidden = false; return; }
    if (emptyWrap) emptyWrap.hidden = true;
    recentWrap.innerHTML = activity.map(a => `<tr><td>${a.type}</td><td>${a.text}</td><td>${formatDate(a.at)}</td></tr>`).join('');
  }

  function toMillis(ts) {
    if (!ts) return 0;
    return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
  }
  function formatDate(ts) {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();

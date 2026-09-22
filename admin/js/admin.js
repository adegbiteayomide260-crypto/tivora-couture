/* ==========================================================================
   TIVORA COUTURE ADMIN — SHARED LAYOUT
   Injects the sidebar into any admin page with a #admin-sidebar slot.
   Highlights the active nav item based on the current filename.
   ========================================================================== */

(function (global) {
  'use strict';

  const NAV = [
    { label: 'Dashboard', href: 'dashboard.html', icon: '◆' },
    { label: 'Products', href: 'products.html', icon: '▤' },
    { label: 'Orders', href: 'orders.html', icon: '▧' },
    { label: 'Custom Couture', href: 'custom-couture.html', icon: '✂' },
    { label: 'Customers', href: 'customers.html', icon: '☺' },
    { label: 'Enquiries', href: 'enquiries.html', icon: '✉' },
    { label: 'Newsletter', href: 'newsletter.html', icon: '✎' },
    { label: 'Analytics', href: 'analytics.html', icon: '▲' },
    { label: 'Settings', href: 'settings.html', icon: '⚙' }
  ];

  function currentPage() {
    return global.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function mount() {
    const slot = document.getElementById('admin-sidebar');
    if (!slot) return;
    const page = currentPage();
    slot.outerHTML = `
    <aside class="admin-sidebar">
      <a href="dashboard.html" class="brand">Tivora Admin</a>
      <nav>
        ${NAV.map(item => `<a href="${item.href}" class="${page === item.href ? 'active' : ''}">${item.icon} ${item.label}</a>`).join('')}
      </nav>
      <button type="button" class="logout-btn" id="adminLogoutBtn">Log Out</button>
    </aside>`;

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
      try { if (global.TivoraAuth) await global.TivoraAuth.logout(); } catch (e) {}
      global.location.href = '../login.html';
    });
  }

  document.addEventListener('DOMContentLoaded', mount);
  global.TivoraAdmin = { mount };
})(window);

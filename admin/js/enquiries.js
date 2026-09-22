/* ==========================================================================
   TIVORA COUTURE ADMIN — ENQUIRIES
   Contact form submissions from contact.html, with mark-handled/archive.
   ========================================================================== */

(function () {
  'use strict';
  let enquiries = [];

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    try {
      enquiries = await window.TivoraFirestore.adminGetEnquiries();
    } catch (err) {
      console.warn('Could not load enquiries:', err.message);
      enquiries = [];
    }
    render();
  }

  function render() {
    const tbody = document.querySelector('#enquiriesTable tbody');
    const empty = document.getElementById('enquiriesEmpty');
    if (!tbody) return;
    if (!enquiries.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;

    tbody.innerHTML = enquiries.map(e => `
      <tr>
        <td>${e.name || '—'}</td>
        <td>${e.phone || ''}<br>${e.email || ''}</td>
        <td style="max-width:320px; white-space:normal;">${e.message || ''}</td>
        <td><span class="status-chip ${e.status === 'handled' ? 'completed' : ''}">${e.status || 'new'}</span></td>
        <td>
          <button type="button" class="admin-btn outline" data-handle="${e.id}">Mark Handled</button>
          <button type="button" class="admin-btn outline" data-archive="${e.id}">Archive</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-handle]').forEach(btn => btn.addEventListener('click', () => updateStatus(btn.dataset.handle, 'handled')));
    tbody.querySelectorAll('[data-archive]').forEach(btn => btn.addEventListener('click', () => updateStatus(btn.dataset.archive, 'archived')));
  }

  async function updateStatus(id, status) {
    try {
      await window.TivoraFirestore.adminUpdateEnquiryStatus(id, status);
      const item = enquiries.find(e => e.id === id);
      if (item) item.status = status;
      render();
    } catch (err) {
      alert('Could not update enquiry: ' + err.message);
    }
  }
})();

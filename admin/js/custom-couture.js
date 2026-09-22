/* ==========================================================================
   TIVORA COUTURE ADMIN — CUSTOM COUTURE REQUESTS
   Full detail view of bespoke design briefs submitted through
   custom-couture.html, with reference images (hosted on Cloudinary) and a
   status control.
   ========================================================================== */

(function () {
  'use strict';
  const STATUSES = ['new', 'reviewing', 'quoted', 'in-progress', 'completed', 'declined'];
  let requests = [];

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    try {
      requests = await window.TivoraFirestore.adminGetCustomCoutureRequests();
    } catch (err) {
      console.warn('Could not load custom couture requests:', err.message);
      requests = [];
    }
    render();
  }

  function render() {
    const wrap = document.getElementById('coutureList');
    const empty = document.getElementById('coutureEmpty');
    if (!wrap) return;
    if (!requests.length) { wrap.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;

    wrap.innerHTML = requests.map(r => `
      <div class="admin-panel">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <h2 style="margin-bottom:2px;">${r.name || '—'}</h2>
            <p class="muted" style="color:var(--a-muted); font-size:0.85rem;">${r.phone || ''} · ${r.email || ''}</p>
          </div>
          <select data-status="${r.id}">
            ${STATUSES.map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <p style="margin-top:0.75rem;"><strong>Design:</strong> ${r.desiredDesign || '—'}</p>
        <p><strong>Event:</strong> ${r.eventType || '—'} ${r.eventDate ? `on ${r.eventDate}` : ''} · <strong>Color:</strong> ${r.preferredColor || '—'}</p>
        ${r.measurements ? `<p><strong>Measurements:</strong> ${r.measurements}</p>` : ''}
        ${r.instructions ? `<p><strong>Notes:</strong> ${r.instructions}</p>` : ''}
        ${(r.referenceImages && r.referenceImages.length) ? `
          <div class="file-preview-list" style="margin-top:0.5rem;">
            ${r.referenceImages.map(src => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Reference image" style="width:72px;height:72px;object-fit:cover;border-radius:4px;"></a>`).join('')}
          </div>` : ''}
      </div>`).join('');

    wrap.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
      try { await window.TivoraFirestore.adminUpdateCoutureStatus(sel.dataset.status, sel.value); }
      catch (err) { alert('Could not update status: ' + err.message); }
    }));
  }
})();

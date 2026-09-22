/* ==========================================================================
   TIVORA COUTURE ADMIN — NEWSLETTER
   Edits the storefront newsletter section's copy/enabled-state (stored at
   settings/newsletter) and lists subscribers from newsletterSubscribers.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', async () => {
    await loadContentForm();
    await loadSubscribers();
    const form = document.getElementById('newsletterContentForm');
    if (form) form.addEventListener('submit', onSaveContent);
  });

  async function loadContentForm() {
    const form = document.getElementById('newsletterContentForm');
    if (!form) return;
    try {
      const settings = await window.TivoraFirestore.getSettings();
      const nl = settings?.newsletter || {};
      form.heading.value = nl.heading || 'Stay in the world of Tivora';
      form.description.value = nl.description || 'Be the first to discover new collections, couture releases and exclusive updates.';
      form.buttonText.value = nl.buttonText || 'Subscribe';
      form.successMessage.value = nl.successMessage || 'Welcome to the world of Tivora — check your inbox shortly.';
      form.enabled.checked = nl.enabled !== false;
    } catch (err) {
      console.warn('Could not load newsletter settings:', err.message);
    }
  }

  async function onSaveContent(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await window.TivoraFirestore.adminUpdateNewsletterSettings({
        heading: form.heading.value, description: form.description.value,
        buttonText: form.buttonText.value, successMessage: form.successMessage.value,
        enabled: form.enabled.checked
      });
    } catch (err) {
      alert('Could not save newsletter settings: ' + err.message);
    }
    btn.disabled = false; btn.textContent = 'Save Changes';
  }

  async function loadSubscribers() {
    const tbody = document.querySelector('#subscribersTable tbody');
    const empty = document.getElementById('subscribersEmpty');
    if (!tbody) return;
    let subs = [];
    try {
      subs = await window.TivoraFirestore.adminGetNewsletterSubscribers();
    } catch (err) {
      console.warn('Could not load subscribers:', err.message);
    }
    if (!subs.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    tbody.innerHTML = subs.map(s => `
      <tr>
        <td>${s.email}</td>
        <td>${formatDate(s.subscribedAt)}</td>
        <td><span class="status-chip ${s.status === 'active' ? 'completed' : ''}">${s.status || 'active'}</span></td>
      </tr>`).join('');
  }

  function formatDate(ts) {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();

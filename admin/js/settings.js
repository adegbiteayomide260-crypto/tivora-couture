/* ==========================================================================
   TIVORA COUTURE ADMIN — SETTINGS
   Operational settings only (WhatsApp, phone, email, social, address,
   business hours, delivery info) — stored at settings/general and read by
   the storefront's contact/footer. Brand identity, typography, colors,
   CEO bio, vision/mission and homepage structure are intentionally NOT
   editable here — they stay controlled by the code/design system per the
   project brief.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', async () => {
    await loadSettings();
    const form = document.getElementById('settingsForm');
    if (form) form.addEventListener('submit', onSave);
  });

  async function loadSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    try {
      const settings = await window.TivoraFirestore.adminGetGeneralSettings();
      if (settings) {
        form.whatsapp.value = settings.whatsapp || '';
        form.phone1.value = settings.phone1 || '';
        form.phone2.value = settings.phone2 || '';
        form.email.value = settings.email || '';
        form.instagram.value = settings.instagram || '';
        form.tiktok.value = settings.tiktok || '';
        form.facebook.value = settings.facebook || '';
        form.address.value = settings.address || '';
        form.businessHours.value = settings.businessHours || '';
        form.deliveryInfo.value = settings.deliveryInfo || '';
      }
    } catch (err) {
      console.warn('Could not load settings:', err.message);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await window.TivoraFirestore.adminUpdateSettings({
        whatsapp: form.whatsapp.value.trim(),
        phone1: form.phone1.value.trim(),
        phone2: form.phone2.value.trim(),
        email: form.email.value.trim(),
        instagram: form.instagram.value.trim(),
        tiktok: form.tiktok.value.trim(),
        facebook: form.facebook.value.trim(),
        address: form.address.value.trim(),
        businessHours: form.businessHours.value.trim(),
        deliveryInfo: form.deliveryInfo.value.trim()
      });
      const msg = document.getElementById('settingsMsg');
      if (msg) msg.textContent = 'Settings saved.';
    } catch (err) {
      alert('Could not save settings: ' + err.message);
    }
    btn.disabled = false; btn.textContent = 'Save Settings';
  }
})();

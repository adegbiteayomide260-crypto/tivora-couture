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

(function () {
  'use strict';

  document.addEventListener('tivora-admin:ready', async () => {
    const button = document.getElementById('saveAtelierImages');
    if (button) button.addEventListener('click', saveAtelierImages);

    try {
      const settings = await window.TivoraFirestore.adminGetGeneralSettings();
      if (settings) {
        for (let i = 1; i <= 5; i++) {
          const status = document.getElementById('atelierImage' + i + 'Status');
          if (status && settings['atelierImage' + i]) {
            status.textContent = 'Current image is saved. Choose a new file to replace it.';
          }
        }
      }
    } catch (err) {
      console.warn('Could not load atelier image settings:', err.message);
    }
  });

  async function saveAtelierImages() {
    const button = document.getElementById('saveAtelierImages');
    const message = document.getElementById('atelierImagesMsg');

    button.disabled = true;
    button.textContent = 'Uploading…';

    try {
      const updates = {};

      for (let i = 1; i <= 5; i++) {
        const input = document.getElementById('atelierImage' + i);
        const file = input && input.files ? input.files[0] : null;

        if (!file) continue;

        const status = document.getElementById('atelierImage' + i + 'Status');
        if (status) status.textContent = 'Uploading…';

        const uploaded = await window.TivoraCloudinary.uploadImage(
          file,
          'tivora-couture/site-images'
        );

        updates['atelierImage' + i] = uploaded.url;

        if (status) status.textContent = 'Uploaded successfully.';
      }

      if (Object.keys(updates).length === 0) {
        message.textContent = 'Choose at least one image first.';
        return;
      }

      await window.TivoraFirestore.adminUpdateSettings(updates);

      message.textContent = 'Atelier images saved successfully.';
    } catch (err) {
      console.error(err);
      message.textContent = 'Could not upload images: ' + err.message;
    } finally {
      button.disabled = false;
      button.textContent = 'Upload & Save Images';
    }
  }
})();

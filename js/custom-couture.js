/* ==========================================================================
   TIVORA COUTURE — CUSTOM COUTURE REQUEST
   Collects a bespoke design brief, previews reference images client-side,
   and on submit: uploads images directly to Cloudinary using the unsigned
   "tivora_uploads" preset (cloud name + preset are public identifiers, no
   secret involved — same pattern as admin/js/cloudinary.js), writes the
   request to Firestore, and opens a prepared WhatsApp message.
   ========================================================================== */

(function () {
  'use strict';
  const CLOUD_NAME = 'haazgdwj';
  const UPLOAD_PRESET = 'tivora_uploads';
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  let referenceFiles = [];

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('coutureForm');
    const fileInput = document.getElementById('coutureFiles');
    const dropZone = document.getElementById('coutureDropZone');
    const previewList = document.getElementById('coutureFilePreview');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => handleFiles(fileInput.files, previewList));
    }
    if (form) form.addEventListener('submit', onSubmit);
  });

  function handleFiles(fileList, previewList) {
    referenceFiles = Array.from(fileList).slice(0, 6);
    if (!previewList) return;
    previewList.innerHTML = '';
    referenceFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement('img');
        img.src = reader.result;
        img.alt = file.name;
        previewList.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadReferenceImages() {
    // Unsigned upload straight to Cloudinary — returns [] gracefully if a
    // file fails or Cloudinary rejects the request, rather than blocking
    // the whole submission.
    if (!referenceFiles.length) return [];
    const urls = [];
    for (const file of referenceFiles) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', UPLOAD_PRESET);
        fd.append('folder', 'tivora-couture/custom-requests');
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('upload failed');
        const uploaded = await res.json();
        if (uploaded.secure_url) urls.push(uploaded.secure_url);
      } catch (err) {
        console.warn('Reference image upload skipped:', file.name, err.message);
      }
    }
    return urls;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending your brief…'; }

    const data = Object.fromEntries(new FormData(form).entries());
    const referenceImages = await uploadReferenceImages();

    const payload = {
      name: data.name, phone: data.phone, email: data.email,
      desiredDesign: data.desiredDesign, preferredColor: data.preferredColor,
      eventType: data.eventType, eventDate: data.eventDate,
      size: data.size, measurements: data.measurements,
      instructions: data.instructions, referenceImages
    };

    try {
      if (window.TivoraFirestore) await window.TivoraFirestore.submitCustomCoutureRequest(payload);
    } catch (err) {
      console.warn('Custom couture request not yet saved to Firestore:', err.message);
    }

    const message = `Hello Tivora Couture, I'd like to request a custom design. Name: ${data.name}. Occasion: ${data.eventType || 'N/A'}. Preferred date: ${data.eventDate || 'N/A'}.`;
    const waHref = window.TivoraHelpers.waLink(window.TIVORA_BRAND.whatsapp, message);

    const confirmation = document.getElementById('coutureConfirmation');
    form.hidden = true;
    if (confirmation) {
      confirmation.hidden = false;
      confirmation.innerHTML = `
        <div class="empty-state">
          <div class="glyph">✓</div>
          <h3>Your brief has been received</h3>
          <p>Our atelier will review your request and reach out shortly. You can also continue the conversation on WhatsApp now.</p>
          <div class="actions">
            <a href="${waHref}" target="_blank" rel="noopener" class="btn btn-primary">Continue on WhatsApp</a>
          </div>
        </div>`;
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Request'; }
  }
})();

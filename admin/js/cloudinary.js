/* ==========================================================================
   TIVORA COUTURE ADMIN — CLOUDINARY UPLOAD
   Uses the confirmed Tivora Cloudinary account with an UNSIGNED upload
   preset, so images upload straight from the browser with no server round
   trip and no secret exposed. Cloud name + upload preset are public
   identifiers, safe to ship in frontend code — the API Secret is never
   used here or anywhere in the frontend.

   If a future need arises for signed uploads (e.g. deleting/replacing
   images, which unsigned presets can't do), that goes through
   netlify/functions/cloudinary-signature.js instead — that function
   already exists and is wired for it.
   ========================================================================== */

(function (global) {
  'use strict';

  const CLOUD_NAME = 'haazgdwj';
  const UPLOAD_PRESET = 'tivora_uploads';
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  async function uploadImage(file, folder) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    if (folder) fd.append('folder', folder);

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Cloudinary upload failed');
    }
    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
  }

  async function uploadMultiple(fileList, folder, onProgress) {
    const files = Array.from(fileList);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const uploaded = await uploadImage(files[i], folder);
        results.push(uploaded);
      } catch (err) {
        console.warn('Upload failed for', files[i].name, err.message);
      }
      if (onProgress) onProgress(i + 1, files.length);
    }
    return results;
  }

  global.TivoraCloudinary = { uploadImage, uploadMultiple, CLOUD_NAME, UPLOAD_PRESET };
})(window);

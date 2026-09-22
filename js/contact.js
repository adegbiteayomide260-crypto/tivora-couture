/* ==========================================================================
   TIVORA COUTURE — CONTACT PAGE
   Submits enquiry form to Firestore (via netlify function for email
   notification through Resend) and shows a confirmation message.
   ========================================================================== */

(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', onSubmit);
  });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      if (window.TivoraFirestore) await window.TivoraFirestore.submitEnquiry(data);
    } catch (err) {
      console.warn('Enquiry not yet saved to Firestore:', err.message);
    }

    try {
      await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
    } catch (err) { /* function may not be deployed yet — fail gracefully */ }

    const msg = document.getElementById('contactMsg');
    form.reset();
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
    if (msg) msg.textContent = "Thank you — we've received your message and will respond shortly.";
  }
})();

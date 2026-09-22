/* ==========================================================================
   TIVORA COUTURE ADMIN — AUTH GUARD
   Include on every protected admin page (all except login.html). Redirects
   to login.html unless the signed-in Firebase user's UID matches the one
   verified Tivora admin account (window.TIVORA_ADMIN_UID) — being logged in
   with *some* account is not enough, only that exact UID is authorized.
   Until Firebase is configured (see firebase/firebase-config.js), it shows
   a clear "not configured" notice instead of silently failing open or
   closed. This is a UX guard only, not the real security boundary — actual
   data access is enforced by Firestore Security Rules (see
   firestore.rules), which check the same UID server-side.
   ========================================================================== */

(function (global) {
  'use strict';

  async function guard() {
    if (!global.TIVORA_FIREBASE_READY) {
      renderNotConfigured();
      return;
    }
    try {
      await global.TivoraAuth.watchAuthState(async (user) => {
        if (!user || user.uid !== global.TIVORA_ADMIN_UID) {
          if (user) { try { await global.TivoraAuth.logout(); } catch (e) {} }
          global.location.href = '../login.html';
          return;
        }
        document.dispatchEvent(new CustomEvent('tivora-admin:ready', { detail: user }));
      });
    } catch (err) {
      renderNotConfigured();
    }
  }

  function renderNotConfigured() {
    const main = document.querySelector('.admin-main');
    if (!main) return;
    main.innerHTML = `
      <div class="admin-panel">
        <h2>Backend not connected yet</h2>
        <p>Firebase Authentication hasn't been configured for this project yet. Add real
        values to <code>firebase/firebase-config.js</code> and set
        <code>TIVORA_FIREBASE_READY = true</code> to enable admin login and data.</p>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', guard);
  global.TivoraAdminAuthGuard = { guard };
})(window);

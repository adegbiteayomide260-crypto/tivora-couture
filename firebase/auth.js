/* ==========================================================================
   TIVORA COUTURE — FIREBASE AUTH WRAPPER
   Used only by the admin app (admin/js/auth.js) for staff login.
   Loaded via the Firebase modular CDN SDK once firebase-config.js holds
   real values. Until then, every method resolves to a clear "not
   configured" error rather than throwing an opaque exception.
   ========================================================================== */

(function (global) {
  'use strict';

  let app, auth;

  async function ensureInit() {
    if (!global.TIVORA_FIREBASE_READY) {
      throw new Error('Firebase is not configured yet. Add real values to firebase/firebase-config.js.');
    }
    if (auth) return auth;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    app = initializeApp(global.TIVORA_FIREBASE_CONFIG);
    auth = getAuth(app);
    global.__tivoraAuthFns = { signInWithEmailAndPassword, signOut, onAuthStateChanged };
    return auth;
  }

  async function login(email, password) {
    const a = await ensureInit();
    return global.__tivoraAuthFns.signInWithEmailAndPassword(a, email, password);
  }

  async function logout() {
    const a = await ensureInit();
    return global.__tivoraAuthFns.signOut(a);
  }

  async function watchAuthState(callback) {
    const a = await ensureInit();
    return global.__tivoraAuthFns.onAuthStateChanged(a, callback);
  }

  global.TivoraAuth = { login, logout, watchAuthState };
})(window);

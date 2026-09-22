/* ==========================================================================
   TIVORA COUTURE — FIREBASE CONFIG
   These are PUBLIC client identifiers (not secrets) — Firebase web config
   is safe to ship in frontend code, access is controlled by Firestore
   Security Rules (see firebase/firestore.rules), not by hiding this object.
   Do NOT put service-account keys or any server-side secret here — those
   belong in Netlify environment variables and are only ever used inside
   netlify/functions/*.js.
   ========================================================================== */

window.TIVORA_FIREBASE_CONFIG = {
  apiKey: ''AIzaSyBd5UiqHXUOBvXroC81CEXADrId9ho-QC0,
  authDomain: 'tivoracouture.firebaseapp.com',
  projectId: 'tivoracouture',
  storageBucket: 'tivoracouture.firebasestorage.app',
  messagingSenderId: '496745085105',
  appId: '1:496745085105:web:9e26ce08d882815d778a90'
};

/* Verified Firebase Auth UID of the one Tivora admin account. Used by
   admin/js/auth.js to authorize the dashboard — being *logged in* is not
   enough, the UID must match this exact value. */
window.TIVORA_ADMIN_UID = 'LNG9C1ewCLU3yRJPsKYUlFEpIeE3';

/* Every module that talks to Firebase (firebase/auth.js, firebase/firestore.js)
   checks this flag first and fails gracefully — empty state / friendly
   message — instead of throwing when it's false. The config above is now
   complete, so this is true. NOTE: Firestore itself is still locked down
   with temporary "allow read, write: if false;" rules until
   firebase/firestore.rules is audited and deployed (see that file) — so
   reads/writes will still be rejected server-side until that happens, even
   though the client is correctly configured to attempt them. */
window.TIVORA_FIREBASE_READY = true;

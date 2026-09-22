/* ==========================================================================
   TIVORA COUTURE — FIRESTORE WRAPPER
   Thin data-access layer over Firestore collections. Every function checks
   TIVORA_FIREBASE_READY first and rejects with a friendly message when the
   backend isn't configured yet, so pages can fall back to empty states
   instead of crashing.

   Collections:
     products              — public read, admin write
     orders                — write on checkout (via Netlify Function),
                              read restricted to the owning customer + admin
     customCoutureRequests — write on submit, admin read
     enquiries             — write on submit, admin read
     newsletterSubscribers — write on subscribe, admin read
     settings              — public read (contact/social/hours), admin write
   ========================================================================== */

(function (global) {
  'use strict';
  let app, db, fns;

  async function ensureInit() {
    if (!global.TIVORA_FIREBASE_READY) {
      throw new Error('Firestore is not configured yet. Add real values to firebase/firebase-config.js.');
    }
    if (db) return db;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const firestoreMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    app = initializeApp(global.TIVORA_FIREBASE_CONFIG);
    db = firestoreMod.getFirestore(app);
    fns = firestoreMod;
    return db;
  }

  async function getProducts(filters) {
    const database = await ensureInit();
    const col = fns.collection(database, 'products');
    const snap = await fns.getDocs(col);
    let items = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    if (filters) items = window.TivoraHelpers.applyProductFilters(items, filters);
    return items;
  }

  async function getProduct(id) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'products', id);
    const snap = await fns.getDoc(ref);
    return snap.exists() ? Object.assign({ id: snap.id }, snap.data()) : null;
  }

  async function submitCustomCoutureRequest(payload) {
    const database = await ensureInit();
    const col = fns.collection(database, 'customCoutureRequests');
    return fns.addDoc(col, Object.assign({ createdAt: fns.serverTimestamp(), status: 'new' }, payload));
  }

  async function submitEnquiry(payload) {
    const database = await ensureInit();
    const col = fns.collection(database, 'enquiries');
    return fns.addDoc(col, Object.assign({ createdAt: fns.serverTimestamp(), status: 'new' }, payload));
  }

  async function getOrderByLookup(orderNumber, phone) {
    const database = await ensureInit();
    const col = fns.collection(database, 'orders');
    // Nested field query — matches the { customer: { phone } } shape written
    // by netlify/functions/create-order.js. Both values are required
    // together so no customer can browse another customer's order.
    const q = fns.query(col, fns.where('orderNumber', '==', orderNumber), fns.where('customer.phone', '==', phone));
    const snap = await fns.getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return Object.assign({ id: d.id }, d.data());
  }

  async function getSettings() {
    const database = await ensureInit();
    const ref = fns.doc(database, 'settings', 'general');
    const snap = await fns.getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }

  /* ========================================================================
     ADMIN-ONLY OPERATIONS
     Every call below only succeeds when the signed-in user is the verified
     Tivora admin (window.TIVORA_ADMIN_UID) — enforced server-side by
     firestore.rules, not just by hiding these buttons in the UI.
     ======================================================================== */

  async function adminGetAllProducts() {
    const database = await ensureInit();
    const snap = await fns.getDocs(fns.collection(database, 'products'));
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  async function adminCreateProduct(product) {
    const database = await ensureInit();
    const col = fns.collection(database, 'products');
    return fns.addDoc(col, Object.assign({ createdAt: fns.serverTimestamp() }, product));
  }

  async function adminUpdateProduct(id, updates) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'products', id);
    return fns.updateDoc(ref, Object.assign({ updatedAt: fns.serverTimestamp() }, updates));
  }

  async function adminDeleteProduct(id) {
    const database = await ensureInit();
    return fns.deleteDoc(fns.doc(database, 'products', id));
  }

  async function adminGetOrders() {
    const database = await ensureInit();
    const col = fns.collection(database, 'orders');
    const q = fns.query(col, fns.orderBy('createdAt', 'desc'));
    const snap = await fns.getDocs(q);
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  async function adminUpdateOrderStatus(id, status) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'orders', id);
    return fns.updateDoc(ref, { status, updatedAt: fns.serverTimestamp() });
  }

  async function adminGetCustomCoutureRequests() {
    const database = await ensureInit();
    const col = fns.collection(database, 'customCoutureRequests');
    const q = fns.query(col, fns.orderBy('createdAt', 'desc'));
    const snap = await fns.getDocs(q);
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  async function adminUpdateCoutureStatus(id, status) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'customCoutureRequests', id);
    return fns.updateDoc(ref, { status, updatedAt: fns.serverTimestamp() });
  }

  async function adminGetEnquiries() {
    const database = await ensureInit();
    const col = fns.collection(database, 'enquiries');
    const q = fns.query(col, fns.orderBy('createdAt', 'desc'));
    const snap = await fns.getDocs(q);
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  async function adminUpdateEnquiryStatus(id, status) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'enquiries', id);
    return fns.updateDoc(ref, { status, updatedAt: fns.serverTimestamp() });
  }

  async function adminGetNewsletterSubscribers() {
    const database = await ensureInit();
    const col = fns.collection(database, 'newsletterSubscribers');
    const q = fns.query(col, fns.orderBy('subscribedAt', 'desc'));
    const snap = await fns.getDocs(q);
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }

  async function adminUpdateNewsletterSettings(content) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'settings', 'newsletter');
    return fns.setDoc(ref, content, { merge: true });
  }

  async function adminGetGeneralSettings() {
    return getSettings();
  }

  async function adminUpdateSettings(updates) {
    const database = await ensureInit();
    const ref = fns.doc(database, 'settings', 'general');
    return fns.setDoc(ref, updates, { merge: true });
  }

  global.TivoraFirestore = {
    getProducts, getProduct, submitCustomCoutureRequest, submitEnquiry,
    getOrderByLookup, getSettings,
    adminGetAllProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
    adminGetOrders, adminUpdateOrderStatus,
    adminGetCustomCoutureRequests, adminUpdateCoutureStatus,
    adminGetEnquiries, adminUpdateEnquiryStatus,
    adminGetNewsletterSubscribers, adminUpdateNewsletterSettings,
    adminGetGeneralSettings, adminUpdateSettings
  };
})(window);

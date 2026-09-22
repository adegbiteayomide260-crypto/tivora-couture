/* ==========================================================================
   TIVORA COUTURE — netlify/functions/track-order.js
   Looks up a single order by orderNumber + phone together (never by
   orderNumber alone) so no customer can browse another customer's order.
   Uses the Firebase Admin SDK (bypasses firestore.rules) since orders are
   locked to admin-only access at the rules level.

   Required Netlify environment variables:
     FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
   ========================================================================== */

const admin = require('firebase-admin');

function getApp() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    })
  });
}

exports.handler = async (event) => {
  const { orderNumber, phone } = event.queryStringParameters || {};
  if (!orderNumber || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: 'orderNumber and phone are both required' }) };
  }
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Firebase Admin credentials are not set on the server yet.' }) };
  }

  try {
    const app = getApp();
    const db = admin.firestore(app);
    const snap = await db.collection('orders')
      .where('orderNumber', '==', orderNumber)
      .where('customer.phone', '==', phone)
      .limit(1)
      .get();

    if (snap.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }
    const doc = snap.docs[0];
    return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

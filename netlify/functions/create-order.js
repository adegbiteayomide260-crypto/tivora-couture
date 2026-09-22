/* ==========================================================================
   TIVORA COUTURE — netlify/functions/create-order.js
   Receives a checkout payload from checkout.js and writes it to Firestore
   as the authoritative order record (system of record — not the cart, not
   the WhatsApp message). Uses the Firebase Admin SDK, which authenticates
   with a service account and bypasses firestore.rules entirely — this is
   the only path that is allowed to create an order document.

   Required Netlify environment variables:
     FIREBASE_PROJECT_ID     tivoracouture
     FIREBASE_CLIENT_EMAIL   from the service account JSON
     FIREBASE_PRIVATE_KEY    from the service account JSON (escape \n as \\n)
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let order;
  try {
    order = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!order.orderNumber || !order.customer || !order.customer.phone || !Array.isArray(order.items) || !order.items.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required order fields' }) };
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    // Backend not configured yet — respond gracefully instead of failing hard.
    return {
      statusCode: 501,
      body: JSON.stringify({ error: 'Firebase Admin credentials are not set on the server yet.' })
    };
  }

  try {
    const app = getApp();
    const db = admin.firestore(app);
    const ref = await db.collection('orders').add({
      orderNumber: order.orderNumber,
      customer: order.customer,
      delivery: order.delivery || {},
      items: order.items,
      subtotal: order.subtotal || 0,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Best-effort notification email — never blocks the order response.
    if (process.env.URL) {
      fetch(`${process.env.URL}/.netlify/functions/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: ref.id, ...order })
      }).catch(() => {});
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, orderId: ref.id, orderNumber: order.orderNumber }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

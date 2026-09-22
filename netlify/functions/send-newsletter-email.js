/* ==========================================================================
   TIVORA COUTURE — netlify/functions/send-newsletter-email.js
   Writes the subscriber to Firestore (newsletterSubscribers) using the
   Admin SDK, then sends a confirmation email via Resend. Firestore write
   happens first — if Resend isn't configured yet, the subscriber is still
   captured, and the response says so plainly instead of pretending success.

   Required Netlify environment variables:
     FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
     RESEND_API_KEY
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

  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };

  let subscriberSaved = false;
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const app = getApp();
      const db = admin.firestore(app);
      await db.collection('newsletterSubscribers').doc(email.toLowerCase()).set({
        email,
        status: 'active',
        subscribedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      subscriberSaved = true;
    } catch (err) {
      console.error('Could not save subscriber:', err.message);
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      statusCode: subscriberSaved ? 200 : 501,
      body: JSON.stringify({ success: subscriberSaved, emailSent: false, error: subscriberSaved ? undefined : 'Neither Firebase Admin nor Resend are configured yet.' })
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Tivora Couture <hello@tivoracouture.com>',
        to: email,
        subject: 'Welcome to the world of Tivora',
        html: `<p>Thank you for subscribing to Tivora Couture. You'll be the first to know about new collections and couture releases.</p>`
      })
    });
    const data = await res.json();
    return { statusCode: res.ok ? 200 : 500, body: JSON.stringify({ success: subscriberSaved, emailSent: res.ok, ...data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: subscriberSaved, emailSent: false, error: err.message }) };
  }
};

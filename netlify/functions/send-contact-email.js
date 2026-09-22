/* ==========================================================================
   TIVORA COUTURE — netlify/functions/send-contact-email.js
   Notifies the team of a new contact form enquiry via Resend.
   Required env var: RESEND_API_KEY
   ========================================================================== */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Resend is not configured yet.' }) };
  }

  const payload = JSON.parse(event.body || '{}');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Tivora Couture <hello@tivoracouture.com>',
        to: process.env.STORE_NOTIFICATION_EMAIL || 'hello@tivoracouture.com',
        subject: `New enquiry — ${payload.name || 'Unknown'}`,
        html: `<p>New contact enquiry.</p><pre>${JSON.stringify(payload, null, 2)}</pre>`
      })
    });
    const data = await res.json();
    return { statusCode: res.ok ? 200 : 500, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

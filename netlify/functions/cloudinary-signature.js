/* ==========================================================================
   TIVORA COUTURE — netlify/functions/cloudinary-signature.js
   Generates a signed upload signature so the browser can upload directly
   to Cloudinary without ever seeing the API secret.
   Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   ========================================================================== */

const crypto = require('crypto');

exports.handler = async () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Cloudinary is not configured yet.' }) };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'tivora-couture';
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  return {
    statusCode: 200,
    body: JSON.stringify({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature
    })
  };
};

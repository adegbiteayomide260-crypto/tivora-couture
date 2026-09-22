# Tivora Couture

Premium Nigerian luxury fashion ecommerce site for **Tivora Couture**
("Designed to be timeless. Worn to be remembered."), founded by
**Olajide Victoria Olusola**. Vanilla HTML/CSS/JS storefront + admin
dashboard, built for Firebase, Cloudinary, Resend, WhatsApp and Netlify —
editable entirely from SPCK on Android / Termux, no build step.

## Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript (no frameworks, no bundler)
- **Auth + Database:** Firebase Authentication (admin only) + Firestore
- **Images:** Cloudinary (unsigned client uploads via the `tivora_uploads` preset)
- **Email:** Resend, sent from Netlify Functions (server-side only)
- **Messaging:** WhatsApp deep links (`wa.me`)
- **Hosting:** Netlify (static site + serverless functions)
- **PWA:** installable, with an offline-safe service worker

## Project status

**Storefront:** fully built — all 11 customer-facing pages, cart/wishlist
via localStorage, product grid/detail wired to Firestore with graceful
empty states, checkout → Netlify Function → Firestore, custom couture
request form with direct-to-Cloudinary image upload, order tracking.

**Admin dashboard:** fully built — Firebase Auth–gated login restricted to
one verified UID, dashboard metrics, product CRUD with Cloudinary uploads,
order management with status workflow, customer view (derived from real
orders/enquiries — no separate fake "customers" collection), custom
couture request management, enquiries, newsletter content + subscriber
list, analytics, and operational settings.

**Firestore Security Rules:** written and audited against every read/write
the code actually performs (see `firebase/firestore.rules`) — **not yet
deployed**. The database is currently locked with `allow read, write: if
false;` everywhere, so nothing will work end-to-end until the rules below
are deployed.

## Before this goes live — required setup

### 1. Firebase Web config — done
`firebase/firebase-config.js` now holds the real, complete config
(`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
`appId`) and `window.TIVORA_FIREBASE_READY = true`. Nothing left to do
here — but see step 2 below, because the client being configured doesn't
mean Firestore will actually respond yet.

### 2. Deploy the Firestore Security Rules — outstanding
Copy `firebase/firestore.rules` into
**Firebase Console → Firestore Database → Rules** (or deploy via the
Firebase CLI: `firebase deploy --only firestore:rules`). Until this
replaces the current `allow read, write: if false;` rules, every read and
write in the app will be rejected — including the admin dashboard.

The rules are scoped to exactly what the code does:
- `products` — public read, admin-only write
- `orders` — **no client access at all**, in either direction. Orders are
  only ever created/read by the Netlify Functions (`create-order.js`,
  `track-order.js`) using the Firebase Admin SDK, which authenticates with
  a service account and bypasses these rules. This is what guarantees one
  customer can never browse another customer's order.
- `customCoutureRequests` / `enquiries` — public create (minimal required
  fields only), admin-only read/update
- `newsletterSubscribers` — written server-side only (Admin SDK), admin-only read
- `settings` — public read, admin-only write

### 3. Add Netlify environment variables
None of the Netlify Functions will work until these are set in
**Netlify → Site settings → Environment variables**:

| Variable | Used by | Where to get it |
|---|---|---|
| `FIREBASE_PROJECT_ID` | create-order, track-order, send-newsletter-email | `tivoracouture` |
| `FIREBASE_CLIENT_EMAIL` | same as above | Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | same as above | Firebase service account JSON (keep the `\n` escapes) |
| `RESEND_API_KEY` | all `send-*-email.js` functions | Resend dashboard (already generated — just needs to be added here) |
| `STORE_NOTIFICATION_EMAIL` | send-order-email, send-custom-request-email, send-contact-email | Wherever you want order/enquiry alerts to land |

Generate the Firebase service account: **Firebase Console → Project
settings → Service accounts → Generate new private key**. That JSON file
contains `client_email` and `private_key` — never commit it, never put it
in a frontend file, only paste its values into Netlify's environment
variables.

Also run `npm install` inside `netlify/functions/` (or wherever your
Netlify build expects it — see `netlify/functions/package.json`) so
`firebase-admin` is available to the functions at deploy time.

### 4. Cloudinary
Already wired and requires no further setup: `admin/js/cloudinary.js` and
`js/custom-couture.js` both upload directly to Cloudinary using the
confirmed **unsigned** preset (`tivora_uploads` on cloud `haazgdwj`).
Cloud name + preset name are public identifiers — safe as shipped. The
API Secret was never put in any frontend file. `cloudinary-signature.js`
is kept in place for a future signed use case (e.g. server-side delete),
but isn't required for the current upload flow to work.

### 5. Resend sending domain
An API key exists but **no sending domain has been verified yet**. Until
one is, the `from` addresses in the email functions
(e.g. `orders@tivoracouture.com`) will fail to send. Verify a domain in
the Resend dashboard, then update the `from` address in each
`netlify/functions/send-*-email.js` file to match.

### 6. Add the real image assets
`assets/images/` is currently empty. Add:
- `tivora-01.webp` through `tivora-05.webp` — the five Qwen-generated
  Tivora fashion images, used across the homepage hero and editorial grid
- `ceo.webp` — the real photo of Olajide Victoria Olusola, used on the
  homepage founder teaser and `about.html`

### 7. PWA icons — done, from the real logo
`assets/icons/favicon.png`, `tivora-icon-192.png` and `tivora-icon-512.png`
were generated directly from the logo mark in the brand flyer you
provided (cropped, not redrawn) — no placeholder letter icon was used.

## Testing checklist once the above is done

1. Confirm `firebase/firebase-config.js` has `TIVORA_FIREBASE_READY = true`
   and real `apiKey`/`appId`.
2. Deploy `firebase/firestore.rules`, then sign in at `/admin/login.html`
   with the verified admin account and confirm the dashboard loads.
3. Log out and confirm the login screen correctly blocks any UID other
   than `LNG9C1ewCLU3yRJPsKYUlFEpIeE3`.
4. Add a test product in the admin, confirm its image uploads to
   Cloudinary and the product appears on `shop.html`.
5. Add it to cart as a guest, complete checkout, and confirm an order
   document appears in Firestore with status `Pending` and the admin
   dashboard's "Total Orders"/"Pending Orders" counts update.
6. Confirm a customer **cannot** query `orders` directly from the browser
   console (should be rejected — order lookup must go through
   `track-order.html`, which calls the Netlify Function).
7. Submit a custom couture request with a reference image and confirm it
   appears under **Admin → Custom Couture Requests** with the image
   loading from Cloudinary.
8. Submit the contact form and confirm it appears under **Admin → Enquiries**.
9. Once Resend's sending domain is verified, confirm order/enquiry/
   newsletter emails actually arrive.

## Local development

No build step. Open the files directly, or serve the folder with any
static server (e.g. `npx serve .`) so relative paths and the service
worker behave the same as on Netlify. Admin pages live under `admin/`
(`admin/login.html`, `admin/pages/*.html`).

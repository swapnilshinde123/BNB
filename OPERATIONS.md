# Aangan Stays

Full-stack Pune stay booking application built with React/Vinext, Cloudflare Workers and D1.

## Included

- Responsive property catalogue, neighbourhood/category/price/guest filters, sorting, saved homes and geographic map.
- ChatGPT sign-in before requesting bookings; personal booking history with status refresh every 15 seconds.
- D1 persistence; a unique property/night index prevents simultaneous overlapping reservations. Pending and confirmed bookings hold dates. Rejected or cancelled requests release dates. All new requests, including host-entered bookings, start pending.
- Owner-only admin APIs, monthly reports by check-in month, status filters, CSV export and manual booking entry.
- Signed WhatsApp webhook that only accepts CONFIRM ANG-XXXXXXXX / REJECT ANG-XXXXXXXX from the configured owner number. Duplicate approvals cannot change reviewed records.
- Optional Meta template notification on new requests. A failed notification does not discard a saved booking.

## Owner setup

ADMIN_EMAIL and OWNER_WHATSAPP are configured in hosted runtime settings. Admin authorization checks the signed-in email on the server. Local development uses .dev.vars and the starter's local test identity; local credentials are excluded from Git.

## Before guest launch

1. Replace the illustrative property catalogue in lib/properties.ts with verified names, descriptions, capacity, rates, addresses, coordinates and owned/licensed photos. Current sample reviews and amenities are illustrative.
2. Connect a Meta WhatsApp Business API phone. The owner's personal WhatsApp number must send commands to that API business number; these are separate roles.
3. Configure hosted secrets WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID. Set WHATSAPP_GRAPH_VERSION to a supported version from the Meta app, WHATSAPP_TEMPLATE to an approved utility template, and optionally WHATSAPP_TEMPLATE_LANGUAGE (default en). The template body needs four text parameters, in order: booking reference, property name, guest name, check-in/out dates.
4. Make a deliberate guest/public access decision. The initial deployment is owner-private. Meta cannot reach an owner-private webhook. Use an authorized public Site deployment or a separately authenticated public webhook service before activating Meta callbacks. Do not put a Site service token in a callback URL.
5. Set the Meta callback URL to /api/whatsapp, use the configured verify token, and subscribe to messages. HMAC verification uses the Meta app secret. Test both authorized and unauthorized senders, rejection, retries and date release.
6. Send a test booking, approve using the registered owner number, and check the guest's status. Alerts need Meta's approved template and valid access token. WhatsApp links alone do not trigger approval.

No payment gateway is connected. Dashboard value is the value of confirmed bookings including the cleaning fee, not cash collected or profit. Pending requests hold dates until reviewed or cancelled; there is no automatic expiration. Reports are based on check-in month, without splitting stays across months.

## Development

Use Node >=22.13. Run the Sites dependency helper, generate migrations with npm run db:generate, build with the Sites build helper and apply local migrations using the README instructions. Run npm run dev for the local preview. Hosted D1 migrations are applied during publication. Never edit an applied migration.

## WhatsApp reference

Meta webhook verification: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/

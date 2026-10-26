# Aangan Stays

Full-stack Pune stay booking application built with React/Vinext, Cloudflare Workers and D1.

## Included

- Responsive property catalogue, neighbourhood/category/price/guest filters, sorting, saved homes and geographic map.
- Google sign-in before requesting bookings; personal booking history with status refresh every 15 seconds.
- D1 persistence; a unique property/night index prevents simultaneous overlapping reservations. Pending and confirmed bookings hold dates. Rejected or cancelled requests release dates. All new requests, including host-entered bookings, start pending.
- Admin property creation and editing, 1–6 optimized photo uploads, cover selection, nightly/cleaning rates, amenities, map-pin selection and guest visibility, saved in D1.
- Owner-only admin APIs, monthly reports by check-in month, status filters, CSV export and manual booking entry.
- Per-property availability calendar. Owners can block or reopen future dates; pending and confirmed nights are locked, and the D1 triggers prevent blocked nights from being booked during concurrent requests.
- Signed WhatsApp webhook that only accepts CONFIRM ANG-XXXXXXXX / REJECT ANG-XXXXXXXX from the configured owner number. Duplicate approvals cannot change reviewed records.
- Optional Meta template notification on new requests. A failed notification does not discard a saved booking.

## Owner setup

ADMIN_EMAIL, GOOGLE_CLIENT_ID and OWNER_WHATSAPP are configured in hosted runtime settings. Register the production origin and exact `/api/auth/google` redirect URI in Google Cloud OAuth settings. Admin authorization checks the verified Google email on the server. Local development uses .dev.vars and the starter's local test identity; local credentials are excluded from Git. The guest catalogue is at `/`, guest booking history at `/my-bookings`, the sign-in chooser at `/login`, and the owner-only dashboard at `/host`. Google handles sign-in; Aangan never stores passwords.

## Before guest launch

1. Use Host dashboard → Add property / Edit property to add verified names, descriptions, capacity, rates, addresses, map pins and owned/licensed photos. Hide any illustrative homes before guest launch. Current sample reviews and amenities are illustrative.
2. Connect a Meta WhatsApp Business API phone. The owner's personal WhatsApp number must send commands to that API business number; these are separate roles.
3. Configure hosted secrets WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID. Set WHATSAPP_GRAPH_VERSION to a supported version from the Meta app, WHATSAPP_TEMPLATE to an approved utility template, and optionally WHATSAPP_TEMPLATE_LANGUAGE (default en). The template body needs four text parameters, in order: booking reference, property name, guest name, check-in/out dates.
4. The guest Site is public so visitors can browse and use its sign-in flow. Host actions and owner APIs remain restricted by server-side ADMIN_EMAIL checks. Meta cannot reach a private webhook; the public webhook route still verifies the Meta signature and owner sender. Do not put a Site service token in a callback URL.
5. Set the Meta callback URL to /api/whatsapp, use the configured verify token, and subscribe to messages. HMAC verification uses the Meta app secret. Test both authorized and unauthorized senders, rejection, retries and date release.
6. Send a test booking, approve using the registered owner number, and check the guest's status. Alerts need Meta's approved template and valid access token. WhatsApp links alone do not trigger approval.

No payment gateway is connected. Dashboard value is the value of confirmed bookings including the cleaning fee, not cash collected or profit. Pending requests hold dates until reviewed or cancelled; there is no automatic expiration. Reports are based on check-in month, without splitting stays across months.

## Development

Use Node >=22.13. Run the Sites dependency helper, generate migrations with npm run db:generate, build with the Sites build helper and apply local migrations using the README instructions. Run npm run dev for the local preview. Hosted D1 migrations are applied during publication. Never edit an applied migration.

## WhatsApp reference

Meta webhook verification: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/

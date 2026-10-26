# Aangan — Pune stays

Responsive property booking app with host approval, guest history, map search and an owner dashboard.

## What works

- React/Vinext guest interface and server API routes.
- Creative responsive design, complementary fonts, animated photo collage, map motion graphics, scroll reveals and reduced-motion support.
- Admin property management with photo upload, map pin selection, nightly rates, amenities and listing visibility.
- Cloudflare D1 booking storage and unique property-night reservations.
- Pending requests hold dates; cancellation or rejection releases them.
- Owner-only confirmation, manual bookings, monthly booking-value reports and CSV export.
- Verified WhatsApp webhook and optional Meta template notifications.

## Current launch status

The local booking flow is tested. Properties, photos, ratings and prices are illustrative. WhatsApp notifications require a connected Meta Business API account and runtime credentials; the phone app alone does not activate them. No payments are collected.

## Run locally

Use Node.js 22.13 or newer.

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mysterious_flatman.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_blocked_dates.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_managed_properties.sql
npm run dev
```

Set `ADMIN_EMAIL=seedy@sites.test` in an ignored `.dev.vars` file for the local test identity, and set `OWNER_WHATSAPP` to the intended owner number in international digits-only format. Local sign-in is simulated by the starter.

## Hosting

The application is deployed as separate Cloudflare Workers for the guest site and host dashboard. Both Workers use the same Cloudflare D1 database binding named DB. Production OAuth and host-only access are configured on both Workers. The GitHub build must set `WRANGLER_CI_OVERRIDE_NAME` to `aangan-admin` for the admin Worker deploy step so Cloudflare publishes it separately from the connected guest Worker. The `.openai/hosting.json` file preserves the selected Sites project identity.

See [OPERATIONS.md](OPERATIONS.md) and [.env.example](.env.example) for configuration and WhatsApp setup. Never commit runtime secrets or local databases.

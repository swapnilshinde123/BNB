# Aangan booking emails

Email delivery is disabled until the server has a verified sender and API key. Do not label emails as delivered based on a booking succeeding.

1. Apply `drizzle/0003_booking_emails.sql` to the shared D1 database before deploying this change.
2. Create a Resend account, verify a domain you own, and add the DNS records Resend supplies. The `workers.dev` address is not a domain you can verify. The Resend test sender can only email the account owner's address.
3. Create a sending-only API key restricted to the verified domain. Save `RESEND_API_KEY` as an encrypted secret on **both** Cloudflare Workers. Set `EMAIL_FROM` to e.g. `Aangan Stays <bookings@YOUR-VERIFIED-DOMAIN>` on both Workers. Keep `ADMIN_EMAIL=swapnil690123@gmail.com`.
4. Verify the admin dashboard shows “Email sender configured”. This confirms configuration presence only; send a test request with the owner's own guest email, then check both incoming emails and the email provider's delivery log.
5. Open Accept/Reject in the admin email, sign in with the approved host account, review details and explicitly submit the action. Test both decisions with separate future bookings. Reopening a decision must not change it again.

Booking creation and status changes enqueue emails atomically in D1. The guest receives a request receipt, then confirmed/rejected/cancelled status. Admin, email and WhatsApp decisions share the same transition. Manual bookings also notify the entered guest email. Amounts are booking totals, not payment receipts.

The Worker processes up to two queued messages concurrently after a web request. The guest Worker also has a Cloudflare Cron trigger (`* * * * *`) invoking its scheduled handler, so retries continue without website traffic. Configure that trigger on the guest Worker only; deployment preserves remote triggers when no triggers are specified in config. Claims prevent concurrent sends; provider idempotency protects normal retries. Provider acceptance is recorded separately from successful booking creation. Failed messages back off and stop after five attempts. Only unsent messages less than seven days old are eligible. Email diagnostics and retry endpoints remain admin-protected internal tools and are not shown in the dashboard.

The email action is a host-authenticated review page. GET never changes status; POST requires an exact same-origin Origin header and the verified owner identity. It does not use bearer approval links or put guest details in URL parameters. Forwarding an email does not grant approval rights.

Check spam folders and sender/provider delivery logs if mail is accepted but not received. Configure both Workers consistently because their database and delivery queue are shared.

## Without a sender domain: owner-only test mode

Set `EMAIL_FROM=Aangan Stays <onboarding@resend.dev>` and `EMAIL_MODE=admin_only` on both Workers. The Resend account email and ADMIN_EMAIL must be the same. Only admin-request messages addressed to that owner email are sent; all guest receipts and decisions are held. The dashboard labels this mode explicitly. A resend.dev sender enforces this restriction even if EMAIL_MODE is accidentally omitted. This is Resend's restricted testing sender, not a verified production sending domain. Provider limits and policies apply.

## Customer emails through the host Google account

The optional relay in `integrations/google-mail-relay` uses Google MailApp with only `script.send_mail`. Deploy it as the owner and allow public HTTP invocation **only with the HMAC checks in place**. Add a random 32-byte hex `AANGAN_RELAY_SECRET` in Script Properties, and the identical value as encrypted `GMAIL_RELAY_SECRET` on both Workers. Set `GMAIL_RELAY_URL` to the deployed /exec URL and `EMAIL_CUSTOMER_PROVIDER=gmail` on both Workers. Keep the existing Resend admin connection. Do not put secrets in source or URL query strings.

The relay accepts fresh signed booking messages only, checks recipient/header formats, and records each job ID. Concurrent/repeated requests do not resend. An interrupted send remains marked for manual review to avoid duplicate mail. Successful markers expire after 30 days; the website retries only jobs younger than seven days. MailApp daily recipient quotas apply; consumer accounts currently typically have 100/day. An expired quota backs off without consuming a sending marker. The admin connection-test button sends only to ADMIN_EMAIL and does not change bookings.

When releasing held messages, final decisions are prioritized. An obsolete request receipt for an already-reviewed booking is suppressed (`provider_id=suppressed:request-reviewed`), without marking it delivered or retrying it.

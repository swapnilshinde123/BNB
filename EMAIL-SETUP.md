# Aangan booking emails

Email delivery is disabled until the server has a verified sender and API key. Do not label emails as delivered based on a booking succeeding.

1. Apply `drizzle/0003_booking_emails.sql` to the shared D1 database before deploying this change.
2. Create a Resend account, verify a domain you own, and add the DNS records Resend supplies. The `workers.dev` address is not a domain you can verify. The Resend test sender can only email the account owner's address.
3. Create a sending-only API key restricted to the verified domain. Save `RESEND_API_KEY` as an encrypted secret on **both** Cloudflare Workers. Set `EMAIL_FROM` to e.g. `Aangan Stays <bookings@YOUR-VERIFIED-DOMAIN>` on both Workers. Keep `ADMIN_EMAIL=swapnil690123@gmail.com`.
4. Verify the admin dashboard shows “Email sender configured”. This confirms configuration presence only; send a test request with the owner's own guest email, then check both incoming emails and the email provider's delivery log.
5. Open Accept/Reject in the admin email, sign in with the approved host account, review details and explicitly submit the action. Test both decisions with separate future bookings. Reopening a decision must not change it again.

Booking creation and status changes enqueue emails atomically in D1. The guest receives a request receipt, then confirmed/rejected/cancelled status. Admin, email and WhatsApp decisions share the same transition. Manual bookings also notify the entered guest email. Amounts are booking totals, not payment receipts.

The Worker processes up to four queued messages after a web request. Claims prevent concurrent sends; Resend idempotency keys protect normal retries. Provider acceptance is recorded separately from successful booking creation. Failed messages back off and stop after five attempts. Admin “Retry recent emails” retries unsent messages less than seven days old. Older records are retained but not resent. Keep this request-driven retry behavior in mind for low-traffic sites; a scheduled queue/cron can be added if guaranteed unattended retries are required.

The email action is a host-authenticated review page. GET never changes status; POST requires an exact same-origin Origin header and the verified owner identity. It does not use bearer approval links or put guest details in URL parameters. Forwarding an email does not grant approval rights.

Check spam folders and sender/provider delivery logs if mail is accepted but not received. Configure both Workers consistently because their database and delivery queue are shared.

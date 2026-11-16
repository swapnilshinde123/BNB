# Guest ID verification

Manual property-host review, not DigiLocker or government authentication. No payment or booking decision is made automatically from an ID document. Optional selfie capture is not enabled.

## Free private bucket option

A dedicated Supabase Free project can supply private storage without an R2 subscription. Create a PRIVATE `guest-ids` bucket with a 5 MB per-object limit and JPG/PNG/PDF MIME allowlist. Do not create public storage policies. Store `ID_STORAGE_SUPABASE_URL`, `ID_STORAGE_SUPABASE_KEY` (server-only service key for this dedicated project), and `ID_STORAGE_SUPABASE_BUCKET=guest-ids` as encrypted Worker secrets on both apps. Keep this project isolated from unrelated data; the service key bypasses RLS. Browser clients receive neither credentials nor Supabase object URLs. Existing signed proxy access, audit, review and deletion rules remain in force.

The adapter can later switch to R2, but existing objects must be migrated and verified before changing providers. Never change providers while files remain only in the original bucket.

## R2 activation requirements

- Create a dedicated PRIVATE R2 bucket `gomzo-guest-ids`. Do not enable r2.dev, a public custom domain or public access. Cloudflare encrypts R2 data at rest.
- Bind it as `GUEST_IDS` to both guest and admin Workers, including persistent deployment configuration.
- Set the same randomly generated secret `ID_FILE_SIGNING_KEY` (at least 32 characters) on both Workers. Never commit it or log it.
- Set `ID_VERIFICATION_ENABLED=true` only after upload, owner/other-host authorization, review, signed-file expiry and cleanup checks pass on disposable test documents.
- `ID_VERIFICATION_PHASE=before_booking` is the default. `after_payment` moves document collection to My bookings; final booking confirmation still requires approval for bookings enrolled in the ID flow. Manual and legacy bookings without an ID requirement are not enrolled automatically.
- Guest Worker cron invokes cleanup every five minutes. Monitor cron failures without logging documents, numbers, tokens or signed URLs. Add an R2 orphan lifecycle safety rule only if it will not delete documents before their stay has ended.

One approved primary ID front file is retained privately per account without automatic expiry. A newly approved front file replaces that retained reference. Other documents expire seven days after checkout, drafts after 24 hours. Access is denied as soon as expiry is reached, even if physical deletion awaits the next successful cleanup. Cleanup retries failures. The retained front file, profile review status/date and audit references survive; last four digits and name are erased from submission records at cleanup. R2 object registry includes orphan uploads for eventual cleanup.

Only the original account owner can upload or reuse primary identity status. Other adult identities are booking-specific. Passport holders marked as foreign guests must re-submit passport plus visa for each stay. Masked Aadhaar files are required, with explicit uploader acknowledgement; this implementation does not perform OCR or automatically redact uploaded files. The numeric input stores last four digits only. Hosts must reject any unmasked Aadhaar and request a correctly masked copy.

Five-minute HMAC links are bound to the authenticated account. Tokens are carried in the URL fragment and then request headers, not server query strings. Every file request rechecks login and property ownership. Responses disable caching and sniffing. Host document viewer overlays the property and booking watermark; it is a visible deterrent, not DRM. No attachment or document link appears in notification emails.

Before enabling production, review whether accepting user-masked Aadhaar meets the business requirement; if automated detection/redaction is mandatory, add a vetted private OCR/redaction pipeline first. Do not advertise automatic Aadhaar verification.

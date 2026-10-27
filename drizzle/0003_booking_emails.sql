CREATE TABLE IF NOT EXISTS booking_emails (
 id TEXT PRIMARY KEY NOT NULL,
 booking_id TEXT NOT NULL REFERENCES bookings(id),
 kind TEXT NOT NULL,
 recipient TEXT NOT NULL,
 payload TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,
 lease TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0,
 sent_at INTEGER,
 provider_id TEXT,
 last_error TEXT
);
CREATE INDEX IF NOT EXISTS booking_emails_pending ON booking_emails(sent_at,next_attempt_at);

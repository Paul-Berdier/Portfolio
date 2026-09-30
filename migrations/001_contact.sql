CREATE TABLE contact_leads (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  company varchar(150) NOT NULL DEFAULT '',
  phone varchar(40) NOT NULL DEFAULT '',
  need varchar(32) NOT NULL CHECK (need IN ('web', 'automation', 'data', 'ai', 'discuss')),
  budget varchar(32) NOT NULL CHECK (budget IN ('undecided', 'under-3000', '3000-7000', '7000-15000', 'over-15000')),
  deadline varchar(32) NOT NULL CHECK (deadline IN ('flexible', '1-month', '3-months', 'later')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 20 AND 5000),
  notification_status varchar(16) NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed')),
  notification_attempts integer NOT NULL DEFAULT 0,
  notification_attempted_at timestamptz,
  notification_sent_at timestamptz,
  notification_error varchar(64)
);
CREATE INDEX contact_leads_created_at_idx ON contact_leads (created_at);
CREATE INDEX contact_leads_notification_idx ON contact_leads (notification_status, notification_attempted_at);

CREATE TABLE contact_idempotency (
  key_hash char(64) PRIMARY KEY,
  payload_hash char(64) NOT NULL,
  lead_id uuid NOT NULL REFERENCES contact_leads(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  expires_at timestamptz NOT NULL
);
CREATE INDEX contact_idempotency_expiry_idx ON contact_idempotency (expires_at);

CREATE TABLE contact_rate_limits (
  bucket_key varchar(64) NOT NULL,
  window_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL,
  PRIMARY KEY (bucket_key, window_start)
);
CREATE INDEX contact_rate_limits_expiry_idx ON contact_rate_limits (expires_at);

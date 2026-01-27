-- Add email authentication support
-- Users can sign in with phone, email, or both

-- Add email column to users table
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;

-- Make phone nullable (was NOT NULL)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Ensure at least one contact method exists
ALTER TABLE users ADD CONSTRAINT users_phone_or_email_check
  CHECK (phone IS NOT NULL OR email IS NOT NULL);

-- Add email column to otp_codes table
ALTER TABLE otp_codes ADD COLUMN email VARCHAR(255);

-- Make phone nullable on otp_codes
ALTER TABLE otp_codes ALTER COLUMN phone DROP NOT NULL;

-- Ensure at least one identifier on OTP codes
ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_phone_or_email_check
  CHECK (phone IS NOT NULL OR email IS NOT NULL);

-- Index for email OTP lookups
CREATE INDEX idx_otp_email_expires ON otp_codes(email, expires_at)
  WHERE email IS NOT NULL;

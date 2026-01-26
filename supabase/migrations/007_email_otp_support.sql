-- Add Email OTP Support
-- =================================
-- This migration adds support for email-based OTP authentication
-- alongside the existing phone-based OTP system.

-- Add email support to users table
ALTER TABLE public.users
  ADD COLUMN email VARCHAR(255) UNIQUE,
  ALTER COLUMN phone DROP NOT NULL;

-- Add email/phone identifier support to otp_codes table
ALTER TABLE public.otp_codes
  ADD COLUMN identifier_type VARCHAR(10) DEFAULT 'phone' NOT NULL,
  ADD COLUMN identifier VARCHAR(255),
  ADD COLUMN email VARCHAR(255);

-- Populate identifier column with existing phone data
UPDATE public.otp_codes
SET identifier = phone,
    identifier_type = 'phone'
WHERE identifier IS NULL;

-- Make identifier required going forward
ALTER TABLE public.otp_codes
  ALTER COLUMN identifier SET NOT NULL;

-- Create new index for efficient identifier lookups
CREATE INDEX idx_otp_identifier_expires
  ON public.otp_codes(identifier, identifier_type, expires_at);

-- Add check constraint to ensure identifier_type is valid
ALTER TABLE public.otp_codes
  ADD CONSTRAINT valid_identifier_type
  CHECK (identifier_type IN ('phone', 'email'));

-- Add constraint to ensure users have at least one contact method
ALTER TABLE public.users
  ADD CONSTRAINT at_least_one_contact
  CHECK (phone IS NOT NULL OR email IS NOT NULL);

-- Update RLS policies for users table to allow viewing by email
-- (Existing policies remain unchanged, this is additive)

COMMENT ON COLUMN public.users.email IS 'User email address for authentication and communication';
COMMENT ON COLUMN public.otp_codes.identifier IS 'Phone number or email address for OTP delivery';
COMMENT ON COLUMN public.otp_codes.identifier_type IS 'Type of identifier: phone or email';

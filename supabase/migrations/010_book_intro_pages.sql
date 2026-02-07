-- Add intro page content columns to books table
-- NULL = use hard-coded default (disclaimer/copyright) or skip page (thank_you/offering)

ALTER TABLE public.books
  ADD COLUMN intro_disclaimer TEXT,
  ADD COLUMN intro_copyright TEXT,
  ADD COLUMN intro_thank_you TEXT,
  ADD COLUMN intro_offering TEXT;

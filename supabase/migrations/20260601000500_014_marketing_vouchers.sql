-- Migration: Marketing Vouchers and Gift Cards Module
-- Description: Creates the marketing_vouchers table for promotional vouchers, gift cards, and discount certificates.

CREATE TABLE IF NOT EXISTS marketing_vouchers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_code      TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  offer_id          UUID REFERENCES marketing_offers(id) ON DELETE SET NULL,
  procedure_id      UUID REFERENCES procedures(id) ON DELETE SET NULL,
  patient_id        UUID REFERENCES patients(id) ON DELETE SET NULL,
  beneficiary_name  TEXT NOT NULL DEFAULT 'Al Portador',
  beneficiary_phone TEXT,
  discount_type     TEXT NOT NULL DEFAULT 'fixed_amount' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value    NUMERIC(10,2) NOT NULL,
  expiration_date   DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  redeemed_at       TIMESTAMPTZ,
  notes             TEXT,
  terms             TEXT DEFAULT 'Válido para una sola aplicación. No acumulable con otras promociones ni canjeable por dinero en efectivo.',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON marketing_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON marketing_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_patient ON marketing_vouchers(patient_id);

ALTER TABLE marketing_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_vouchers_all" ON marketing_vouchers FOR ALL TO authenticated USING (true) WITH CHECK (true);

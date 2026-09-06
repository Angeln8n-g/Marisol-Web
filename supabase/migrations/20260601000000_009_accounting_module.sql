-- Migration: General Accounting Module
-- Description: Accounts Receivable (patient invoices & installments), Accounts Payable (bills, labs, vendors), and Utility/Service Payments
-- Requirements: 1.1, 1.2

-- 1. Invoices (Accounts Receivable)
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id       UUID REFERENCES clinics(id) ON DELETE SET NULL,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days',
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_due     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'partial', 'paid', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);

-- 2. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  procedure_id  UUID REFERENCES procedures(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 3. Payments Received (Patient collections & installments)
CREATE TABLE IF NOT EXISTS payments_received (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id         UUID REFERENCES clinics(id) ON DELETE SET NULL,
  amount            NUMERIC(10,2) NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance', 'other')),
  reference_number  TEXT,
  payment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by       UUID REFERENCES auth.users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_received_invoice ON payments_received(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_date ON payments_received(payment_date);

-- 4. Bills Payable (Accounts Payable & Utilities/Services)
CREATE TABLE IF NOT EXISTS bills_payable (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number     TEXT,
  vendor_name     TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('dental_supplies', 'dental_lab', 'utilities', 'rent', 'maintenance', 'marketing', 'salaries', 'other')),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE SET NULL,
  bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_due     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  notes           TEXT,
  attachment_url  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_payable_category ON bills_payable(category);
CREATE INDEX IF NOT EXISTS idx_bills_payable_due ON bills_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_payable_status ON bills_payable(status);

-- 5. Payments Made (Outgoing payments to vendors/services)
CREATE TABLE IF NOT EXISTS payments_made (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id           UUID NOT NULL REFERENCES bills_payable(id) ON DELETE CASCADE,
  clinic_id         UUID REFERENCES clinics(id) ON DELETE SET NULL,
  amount            NUMERIC(10,2) NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'transfer', 'card', 'check', 'other')),
  reference_number  TEXT,
  payment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by           UUID REFERENCES auth.users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_made_bill ON payments_made(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_made_date ON payments_made(payment_date);

-- 6. Enable RLS and Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_made ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_all" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payments_received_all" ON payments_received FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bills_payable_all" ON bills_payable FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payments_made_all" ON payments_made FOR ALL TO authenticated USING (true) WITH CHECK (true);

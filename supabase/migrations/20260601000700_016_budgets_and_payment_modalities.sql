-- Migration: Budgets Management, Payment Modalities & Invoicing Integration
-- Description: Adds tables for budgets, line items, and payment installments/schedules.
-- Integrates with invoices and procedure tracking.

-- 1. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_number       TEXT NOT NULL UNIQUE,
  patient_id          UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name        TEXT,
  patient_phone       TEXT,
  patient_email       TEXT,
  patient_id_number   TEXT,
  clinic_id           UUID REFERENCES clinics(id) ON DELETE SET NULL,
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until         DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_modality    TEXT NOT NULL DEFAULT 'single_payment'
                      CHECK (payment_modality IN ('single_payment', 'installments', 'per_session', 'custom_financing')),
  down_payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  installments_count  INT NOT NULL DEFAULT 1,
  payment_frequency   TEXT DEFAULT 'monthly'
                      CHECK (payment_frequency IN ('per_visit', 'weekly', 'biweekly', 'monthly', 'custom')),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'partially_invoiced', 'invoiced', 'expired', 'cancelled')),
  notes               TEXT,
  terms_and_conditions TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_patient ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_clinic ON budgets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_issue_date ON budgets(issue_date);

-- 2. Budget Items Table
CREATE TABLE IF NOT EXISTS budget_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id         UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  procedure_id      UUID REFERENCES procedures(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  category          TEXT,
  quantity          NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  sessions_estimated INT DEFAULT 1,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_procedure ON budget_items(procedure_id);

-- 3. Budget Installments / Payment Schedules Table
CREATE TABLE IF NOT EXISTS budget_installments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id         UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  concept           TEXT NOT NULL,
  due_date          DATE,
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'invoiced', 'paid', 'cancelled')),
  invoice_id        UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_installments_budget ON budget_installments(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_installments_invoice ON budget_installments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_budget_installments_due ON budget_installments(due_date);

-- 4. Extend Invoices with Budget references
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'budget_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'budget_installment_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN budget_installment_id UUID REFERENCES budget_installments(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'payment_modality'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_modality TEXT DEFAULT 'single_payment';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_budget ON invoices(budget_id);
CREATE INDEX IF NOT EXISTS idx_invoices_budget_installment ON invoices(budget_installment_id);

-- 5. Extend Procedure Tracking with Budget and Billing references
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedure_tracking' AND column_name = 'budget_id'
  ) THEN
    ALTER TABLE procedure_tracking ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedure_tracking' AND column_name = 'budget_item_id'
  ) THEN
    ALTER TABLE procedure_tracking ADD COLUMN budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedure_tracking' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE procedure_tracking ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'procedure_tracking' AND column_name = 'billing_status'
  ) THEN
    ALTER TABLE procedure_tracking ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'unbilled'
      CHECK (billing_status IN ('unbilled', 'invoiced', 'paid', 'included_in_budget'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_procedure_tracking_budget ON procedure_tracking(budget_id);
CREATE INDEX IF NOT EXISTS idx_procedure_tracking_invoice ON procedure_tracking(invoice_id);

-- 6. Enable RLS and Policies for new tables
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_all" ON budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "budget_items_all" ON budget_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "budget_installments_all" ON budget_installments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read for anon if needed
CREATE POLICY "budgets_anon_read" ON budgets FOR SELECT TO anon USING (true);
CREATE POLICY "budget_items_anon_read" ON budget_items FOR SELECT TO anon USING (true);
CREATE POLICY "budget_installments_anon_read" ON budget_installments FOR SELECT TO anon USING (true);

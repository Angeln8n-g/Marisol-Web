-- ==============================================================================
-- Migración 026: Restricción de Facturación Única por Cita (Single Invoice per Appointment)
-- ==============================================================================

-- 1. Agregar columnas de control de facturación en appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'unbilled' 
    CHECK (billing_status IN ('unbilled', 'billed', 'exempt'));

CREATE INDEX IF NOT EXISTS idx_appointments_invoice_id ON appointments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_appointments_billing_status ON appointments(billing_status);

-- 2. Restricción UNIQUE en invoices: una cita solo puede tener una factura activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_invoice_per_appointment
  ON invoices(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- 3. Trigger para sincronizar automáticamente el estado de facturación en appointments
CREATE OR REPLACE FUNCTION sync_appointment_billing_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE appointments
    SET 
      billing_status = 'billed',
      invoice_id = NEW.id,
      updated_at = now()
    WHERE id = NEW.appointment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_appointment_invoice ON invoices;
CREATE TRIGGER trg_sync_appointment_invoice
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_appointment_billing_status();

-- 4. Trigger para revertir facturación si la factura es cancelada o eliminada
CREATE OR REPLACE FUNCTION sync_appointment_billing_on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.appointment_id IS NOT NULL THEN
      UPDATE appointments
      SET 
        billing_status = 'unbilled',
        invoice_id = NULL,
        updated_at = now()
      WHERE id = NEW.appointment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.appointment_id IS NOT NULL THEN
      UPDATE appointments
      SET 
        billing_status = 'unbilled',
        invoice_id = NULL,
        updated_at = now()
      WHERE id = OLD.appointment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_appointment_invoice_change ON invoices;
CREATE TRIGGER trg_sync_appointment_invoice_change
AFTER UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_appointment_billing_on_invoice_change();

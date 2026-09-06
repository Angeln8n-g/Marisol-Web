-- ==============================================================================
-- Migración 021: Órdenes de Compra y Reorden Predictivo para Proveedores
-- ==============================================================================

-- 1. Tabla de Órdenes de Compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id               UUID REFERENCES clinics(id) ON DELETE SET NULL,
  order_number            TEXT NOT NULL UNIQUE,
  supplier_name           TEXT NOT NULL,
  supplier_contact        TEXT,
  supplier_rnc            TEXT,
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  forecast_window_days    INTEGER DEFAULT 14,
  notes                   TEXT,
  total_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  estimated_delivery_date DATE,
  received_at             TIMESTAMPTZ,
  created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentarios descriptivos
COMMENT ON TABLE purchase_orders IS 'Órdenes de compra a distribuidores y suplidores dentales con soporte de reposición predictiva';
COMMENT ON COLUMN purchase_orders.status IS 'Estado del flujo: draft (borrador), sent (enviada al suplidor), received (mercancía ingresada a inventario), cancelled';

-- 2. Tabla de Ítems / Renglones de la Orden de Compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  package_quantity  NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (package_quantity > 0),
  unit_cost         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  total_cost        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  received_quantity NUMERIC(10,2) DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE purchase_order_items IS 'Renglones detallados de materiales o instrumental incluidos en la orden de compra';

-- 3. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_purchase_orders_clinic ON purchase_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created ON purchase_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item ON purchase_order_items(item_id);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_all_auth" ON purchase_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "purchase_order_items_all_auth" ON purchase_order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Función de Base de Datos para Recepción e Ingreso Automático a Inventario
CREATE OR REPLACE FUNCTION receive_purchase_order(p_order_id UUID, p_received_by UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order purchase_orders%ROWTYPE;
  v_item RECORD;
  v_items_count INTEGER := 0;
BEGIN
  -- 1. Verificar existencia y estado de la orden
  SELECT * INTO v_order FROM purchase_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La orden de compra no existe.';
  END IF;

  IF v_order.status = 'received' THEN
    RAISE EXCEPTION 'Esta orden de compra ya fue recibida previamente.';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'No se puede recibir una orden cancelada.';
  END IF;

  -- 2. Procesar cada renglón de la orden e incrementar stock
  FOR v_item IN (
    SELECT poi.item_id, poi.package_quantity, poi.unit_cost, ii.name AS item_name, ii.clinic_id
    FROM purchase_order_items poi
    JOIN inventory_items ii ON poi.item_id = ii.id
    WHERE poi.order_id = p_order_id
  ) LOOP
    -- Incrementar stock actual en inventory_items
    UPDATE inventory_items
    SET current_stock = current_stock + v_item.package_quantity,
        cost_price = CASE WHEN v_item.unit_cost > 0 THEN v_item.unit_cost ELSE cost_price END,
        updated_at = now()
    WHERE id = v_item.item_id;

    -- Registrar movimiento de entrada en Kardex
    INSERT INTO inventory_movements (
      item_id,
      clinic_id,
      movement_type,
      quantity,
      reason,
      performed_by,
      created_at
    ) VALUES (
      v_item.item_id,
      COALESCE(v_order.clinic_id, v_item.clinic_id),
      'entry',
      v_item.package_quantity,
      'Recepción de Orden de Compra #' || v_order.order_number || ' (' || v_order.supplier_name || ')',
      p_received_by,
      now()
    );

    -- Actualizar cantidad recibida en el renglón
    UPDATE purchase_order_items
    SET received_quantity = package_quantity
    WHERE order_id = p_order_id AND item_id = v_item.item_id;

    v_items_count := v_items_count + 1;
  END LOOP;

  -- 3. Marcar orden como 'received'
  UPDATE purchase_orders
  SET status = 'received',
      received_at = now(),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'items_received', v_items_count
  );
END;
$$;

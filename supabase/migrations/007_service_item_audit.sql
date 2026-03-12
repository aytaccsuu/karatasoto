-- ============================================================
-- 007: Servis Kalemi Değişiklik Kaydı (Audit Log)
-- Servis fişine sonradan eklenen/silinen kalemlerin kaydı
-- PDF'e yansımaz — yalnızca iç kullanım
-- ============================================================

CREATE TABLE IF NOT EXISTS service_item_audit (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID          NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  action            VARCHAR(6)    NOT NULL CHECK (action IN ('add', 'remove')),
  item_name         VARCHAR(200)  NOT NULL,
  quantity          NUMERIC(10,3) NOT NULL,
  unit_price        NUMERIC(10,2) NOT NULL,
  line_total        NUMERIC(10,2) NOT NULL,
  note              TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_item_audit_record
  ON service_item_audit(service_record_id, created_at DESC);

-- ============================================================
-- add_service_item: Mevcut servise atomik kalem ekleme
-- Toplamları günceller, veresiye ise borcu ayarlar, log yazar
-- ============================================================
CREATE OR REPLACE FUNCTION add_service_item(
  p_service_record_id UUID,
  p_product_id        UUID    DEFAULT NULL,
  p_name              TEXT,
  p_quantity          NUMERIC,
  p_unit_price        NUMERIC,
  p_note              TEXT    DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_rec            service_records%ROWTYPE;
  v_line_total     NUMERIC;
  v_new_parts      NUMERIC;
  v_new_kdv        NUMERIC;
  v_new_grand      NUMERIC;
  v_new_debt_added NUMERIC;
  v_sort_order     INT;
  v_item_id        UUID;
  v_cust_debt      NUMERIC;
BEGIN
  SELECT * INTO v_rec FROM service_records WHERE id = p_service_record_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servis kaydi bulunamadi';
  END IF;

  v_line_total := ROUND(p_quantity * p_unit_price, 2);
  v_new_parts  := v_rec.parts_total + v_line_total;

  IF v_rec.kdv_enabled THEN
    v_new_kdv := ROUND(v_new_parts * 0.20, 2);
  ELSE
    v_new_kdv := 0;
  END IF;

  v_new_grand := v_new_parts + v_rec.labor_cost + v_new_kdv;

  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
    FROM service_line_items WHERE service_record_id = p_service_record_id;

  INSERT INTO service_line_items
    (service_record_id, product_id, name, quantity, unit_price, line_total, sort_order)
  VALUES
    (p_service_record_id, p_product_id, p_name, p_quantity, p_unit_price, v_line_total, v_sort_order)
  RETURNING id INTO v_item_id;

  v_new_debt_added := v_rec.debt_added;
  IF v_rec.payment_type = 'veresiye' THEN
    v_new_debt_added := v_rec.debt_added + (v_new_grand - v_rec.grand_total);
  END IF;

  UPDATE service_records SET
    parts_total = v_new_parts,
    kdv_amount  = v_new_kdv,
    grand_total = v_new_grand,
    debt_added  = v_new_debt_added,
    updated_at  = NOW()
  WHERE id = p_service_record_id;

  IF v_rec.payment_type = 'veresiye' THEN
    UPDATE customers
      SET total_debt = GREATEST(0, total_debt + (v_new_grand - v_rec.grand_total)),
          updated_at = NOW()
      WHERE id = v_rec.customer_id
      RETURNING total_debt INTO v_cust_debt;

    INSERT INTO debt_transactions
      (customer_id, service_record_id, transaction_type, amount, description, balance_after)
    VALUES (
      v_rec.customer_id, p_service_record_id, 'duzeltme',
      v_new_grand - v_rec.grand_total,
      'Kalem eklendi: ' || p_name,
      v_cust_debt
    );
  END IF;

  INSERT INTO service_item_audit
    (service_record_id, action, item_name, quantity, unit_price, line_total, note)
  VALUES
    (p_service_record_id, 'add', p_name, p_quantity, p_unit_price, v_line_total, p_note);

  RETURN jsonb_build_object(
    'item_id',        v_item_id,
    'new_grand_total', v_new_grand,
    'new_parts_total', v_new_parts
  );
END;
$$;

-- ============================================================
-- remove_service_item: Mevcut servisten atomik kalem silme
-- Toplamları günceller, veresiye ise borcu ayarlar, log yazar
-- ============================================================
CREATE OR REPLACE FUNCTION remove_service_item(
  p_item_id UUID,
  p_note    TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item           service_line_items%ROWTYPE;
  v_rec            service_records%ROWTYPE;
  v_new_parts      NUMERIC;
  v_new_kdv        NUMERIC;
  v_new_grand      NUMERIC;
  v_new_debt_added NUMERIC;
  v_cust_debt      NUMERIC;
BEGIN
  SELECT * INTO v_item FROM service_line_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kalem bulunamadi';
  END IF;

  SELECT * INTO v_rec FROM service_records WHERE id = v_item.service_record_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servis kaydi bulunamadi';
  END IF;

  v_new_parts := GREATEST(0, v_rec.parts_total - v_item.line_total);

  IF v_rec.kdv_enabled THEN
    v_new_kdv := ROUND(v_new_parts * 0.20, 2);
  ELSE
    v_new_kdv := 0;
  END IF;

  v_new_grand := v_new_parts + v_rec.labor_cost + v_new_kdv;

  -- Önce log (silmeden önce bilgiyi kaydet)
  INSERT INTO service_item_audit
    (service_record_id, action, item_name, quantity, unit_price, line_total, note)
  VALUES
    (v_item.service_record_id, 'remove', v_item.name,
     v_item.quantity, v_item.unit_price, v_item.line_total, p_note);

  DELETE FROM service_line_items WHERE id = p_item_id;

  v_new_debt_added := v_rec.debt_added;
  IF v_rec.payment_type = 'veresiye' THEN
    v_new_debt_added := GREATEST(0, v_rec.debt_added - (v_rec.grand_total - v_new_grand));
  END IF;

  UPDATE service_records SET
    parts_total = v_new_parts,
    kdv_amount  = v_new_kdv,
    grand_total = v_new_grand,
    debt_added  = v_new_debt_added,
    updated_at  = NOW()
  WHERE id = v_item.service_record_id;

  IF v_rec.payment_type = 'veresiye' THEN
    UPDATE customers
      SET total_debt = GREATEST(0, total_debt - (v_rec.grand_total - v_new_grand)),
          updated_at = NOW()
      WHERE id = v_rec.customer_id
      RETURNING total_debt INTO v_cust_debt;

    INSERT INTO debt_transactions
      (customer_id, service_record_id, transaction_type, amount, description, balance_after)
    VALUES (
      v_rec.customer_id, v_item.service_record_id, 'duzeltme',
      -(v_rec.grand_total - v_new_grand),
      'Kalem silindi: ' || v_item.name,
      v_cust_debt
    );
  END IF;

  RETURN jsonb_build_object(
    'new_grand_total', v_new_grand,
    'new_parts_total', v_new_parts
  );
END;
$$;

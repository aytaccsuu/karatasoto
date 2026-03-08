-- ============================================================
-- 006: RPC Fonksiyonları — Atomik İşlemler
-- Her biri birden fazla DB round-trip'i tek çağrıya indirger
-- ============================================================

-- Trigram extension (ilike '%...%' aramaları için GIN index desteği)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Müşteri ad/soyad araması için GIN trigram indexleri
CREATE INDEX IF NOT EXISTS idx_customers_first_name_trgm
  ON customers USING GIN (first_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_last_name_trgm
  ON customers USING GIN (last_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm
  ON customers USING GIN (phone gin_trgm_ops) WHERE phone IS NOT NULL;

-- ============================================================
-- create_service_full: Servis kaydı + satır kalemleri + borç
-- 5 sequential HTTP call → 1 tek çağrı
-- ============================================================
CREATE OR REPLACE FUNCTION create_service_full(
  p_vehicle_id    UUID,
  p_customer_id   UUID,
  p_service_date  DATE,
  p_km_at_service INT     DEFAULT NULL,
  p_labor_cost    NUMERIC DEFAULT 0,
  p_parts_total   NUMERIC DEFAULT 0,
  p_grand_total   NUMERIC DEFAULT 0,
  p_kdv_enabled   BOOLEAN DEFAULT FALSE,
  p_kdv_amount    NUMERIC DEFAULT 0,
  p_payment_type  TEXT    DEFAULT 'nakit',
  p_amount_paid   NUMERIC DEFAULT 0,
  p_debt_added    NUMERIC DEFAULT 0,
  p_notes         TEXT    DEFAULT NULL,
  p_line_items    JSONB   DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record   service_records%ROWTYPE;
  v_new_debt NUMERIC;
BEGIN
  -- 1. Servis kaydını oluştur
  INSERT INTO service_records (
    vehicle_id, customer_id, service_date, km_at_service,
    labor_cost, parts_total, grand_total, kdv_enabled, kdv_amount,
    payment_type, amount_paid, debt_added, notes
  ) VALUES (
    p_vehicle_id,
    p_customer_id,
    p_service_date,
    p_km_at_service,   -- NULL geçilirse NULL kaydedilir
    p_labor_cost,
    p_parts_total,
    p_grand_total,
    p_kdv_enabled,
    p_kdv_amount,
    p_payment_type,
    p_amount_paid,
    p_debt_added,
    p_notes
  )
  RETURNING * INTO v_record;

  -- 2. Satır kalemlerini toplu ekle (product_id boş string → NULL)
  IF jsonb_array_length(p_line_items) > 0 THEN
    INSERT INTO service_line_items (
      service_record_id, product_id, name, quantity, unit_price, line_total, sort_order
    )
    SELECT
      v_record.id,
      (NULLIF(item->>'product_id', ''))::UUID,
      item->>'name',
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      (item->>'line_total')::NUMERIC,
      (item->>'sort_order')::INT
    FROM jsonb_array_elements(p_line_items) AS item;
  END IF;

  -- 3. Veresiye ise müşteri borcunu atomik güncelle + işlem kaydı
  IF p_payment_type = 'veresiye' AND p_grand_total > 0 THEN
    UPDATE customers
      SET total_debt = COALESCE(total_debt, 0) + p_grand_total,
          updated_at = NOW()
      WHERE id = p_customer_id
      RETURNING total_debt INTO v_new_debt;

    INSERT INTO debt_transactions (
      customer_id, service_record_id, transaction_type,
      amount, description, balance_after
    ) VALUES (
      p_customer_id,
      v_record.id,
      'veresiye',
      p_grand_total,
      'Servis - ' || p_service_date::TEXT,
      v_new_debt
    );
  END IF;

  RETURN to_jsonb(v_record);
END;
$$;

-- ============================================================
-- record_payment: Ödeme al + borç düş + işlem kaydı
-- 3 sequential HTTP call → 1 tek çağrı
-- ============================================================
CREATE OR REPLACE FUNCTION record_payment(
  p_customer_id       UUID,
  p_amount            NUMERIC,
  p_description       TEXT    DEFAULT 'Manuel odeme',
  p_service_record_id UUID    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_debt    NUMERIC;
  v_transaction debt_transactions%ROWTYPE;
BEGIN
  -- Borcu atomik güncelle
  UPDATE customers
    SET total_debt = GREATEST(0, COALESCE(total_debt, 0) - p_amount),
        updated_at = NOW()
    WHERE id = p_customer_id
    RETURNING total_debt INTO v_new_debt;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Musteri bulunamadi: %', p_customer_id;
  END IF;

  -- Ödeme işlem kaydı ekle
  INSERT INTO debt_transactions (
    customer_id, service_record_id, transaction_type,
    amount, description, balance_after
  ) VALUES (
    p_customer_id,
    p_service_record_id,
    'odeme',
    -p_amount,
    p_description,
    v_new_debt
  )
  RETURNING * INTO v_transaction;

  RETURN jsonb_build_object(
    'transaction', to_jsonb(v_transaction),
    'new_debt',    v_new_debt
  );
END;
$$;

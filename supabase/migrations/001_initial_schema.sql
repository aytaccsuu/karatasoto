-- ============================================
-- KARATAS OTO - Veritabani Semasi
-- Platform: Supabase (PostgreSQL)
-- ============================================

-- UUID uzantisini etkinlestir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLO: customers (Musteriler)
-- ============================================
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  total_debt    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLO: vehicles (Araclar)
-- ============================================
CREATE TABLE vehicles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plate          VARCHAR(20) NOT NULL UNIQUE,
  brand          VARCHAR(100) NOT NULL,
  model          VARCHAR(100) NOT NULL,
  year           SMALLINT,
  km             INTEGER,
  chassis_number VARCHAR(100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLO: products (Urun katalogu)
-- ============================================
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit        VARCHAR(50) DEFAULT 'adet',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLO: service_records (Servis kayitlari)
-- ============================================
CREATE TABLE service_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  km_at_service   INTEGER,
  labor_cost      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  parts_total     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  grand_total     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_type    VARCHAR(20) NOT NULL CHECK (payment_type IN ('nakit', 'kredi_karti', 'veresiye')),
  amount_paid     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  debt_added      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLO: service_line_items (Servis kalemleri)
-- ============================================
CREATE TABLE service_line_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  name              VARCHAR(200) NOT NULL,
  quantity          DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price        DECIMAL(10,2) NOT NULL,
  line_total        DECIMAL(10,2) NOT NULL,
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLO: debt_transactions (Veresiye defteri)
-- ============================================
CREATE TABLE debt_transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_record_id UUID REFERENCES service_records(id) ON DELETE SET NULL,
  transaction_type  VARCHAR(20) NOT NULL CHECK (transaction_type IN ('veresiye', 'odeme', 'duzeltme')),
  amount            DECIMAL(10,2) NOT NULL,
  description       TEXT,
  balance_after     DECIMAL(10,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXLER
-- ============================================
CREATE INDEX idx_vehicles_customer_id      ON vehicles(customer_id);
CREATE INDEX idx_vehicles_plate            ON vehicles(plate);
CREATE INDEX idx_service_records_vehicle   ON service_records(vehicle_id);
CREATE INDEX idx_service_records_customer  ON service_records(customer_id);
CREATE INDEX idx_service_records_date      ON service_records(service_date);
CREATE INDEX idx_service_line_items_record ON service_line_items(service_record_id);
CREATE INDEX idx_debt_transactions_customer ON debt_transactions(customer_id);
CREATE INDEX idx_customers_name            ON customers(last_name, first_name);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_transactions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON vehicles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON service_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON service_line_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON debt_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- DASHBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM customers)                                                        AS total_customers,
  (SELECT COUNT(*) FROM vehicles)                                                         AS total_vehicles,
  (SELECT COUNT(DISTINCT vehicle_id) FROM service_records WHERE service_date = CURRENT_DATE) AS todays_vehicle_count,
  (SELECT COALESCE(SUM(grand_total), 0) FROM service_records WHERE service_date = CURRENT_DATE) AS todays_revenue,
  (SELECT COALESCE(SUM(total_debt), 0) FROM customers)                                    AS total_credit_debt;

-- ============================================
-- ORNEK URUN VERILERI
-- ============================================
INSERT INTO products (name, unit_price, unit) VALUES
  ('Motor Yagi', 450.00, 'litre'),
  ('Yag Filtresi', 150.00, 'adet'),
  ('Hava Filtresi', 200.00, 'adet'),
  ('Yakit Filtresi', 180.00, 'adet'),
  ('On Balata', 800.00, 'takim'),
  ('Arka Balata', 600.00, 'takim'),
  ('Atesleme Bujisi', 120.00, 'adet'),
  ('Antifriz', 250.00, 'litre'),
  ('Fren Hidrolik Yagi', 150.00, 'adet'),
  ('Akumulator', 1500.00, 'adet');

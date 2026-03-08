-- ============================================================
-- 005: Performans İyileştirme — Composite Indexes
-- Veri büyüdükçe sorgu sürelerini minimize etmek için
-- ============================================================

-- service_records: en çok filtrelenen alanlar
CREATE INDEX IF NOT EXISTS idx_service_records_customer_date
  ON service_records(customer_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_date
  ON service_records(vehicle_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_records_date_desc
  ON service_records(service_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_records_payment_type
  ON service_records(payment_type);

-- service_line_items: her servis kaydında JOIN ile geliyor
CREATE INDEX IF NOT EXISTS idx_service_line_items_record
  ON service_line_items(service_record_id);

-- debt_transactions: müşteri borç sorguları
CREATE INDEX IF NOT EXISTS idx_debt_transactions_customer_date
  ON debt_transactions(customer_id, created_at DESC);

-- vehicles: müşteriye ait araçlar ve plaka araması
CREATE INDEX IF NOT EXISTS idx_vehicles_customer
  ON vehicles(customer_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate
  ON vehicles(plate);

-- customers: isim sıralaması ve telefon araması
CREATE INDEX IF NOT EXISTS idx_customers_name
  ON customers(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone) WHERE phone IS NOT NULL;

-- customers: veresiyeli müşteriler listesi
CREATE INDEX IF NOT EXISTS idx_customers_total_debt
  ON customers(total_debt DESC) WHERE total_debt > 0;

-- quotes: durum ve tarih filtrelemesi
CREATE INDEX IF NOT EXISTS idx_quotes_customer_date
  ON quotes(customer_id, quote_date DESC);

CREATE INDEX IF NOT EXISTS idx_quotes_status_date
  ON quotes(status, quote_date DESC);

-- products: aktif ürün listesi
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON products(is_active, name) WHERE is_active = true;

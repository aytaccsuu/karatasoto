-- Servis kayıtlarına KDV alanları ekleme
ALTER TABLE service_records
  ADD COLUMN IF NOT EXISTS kdv_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kdv_amount  NUMERIC(12,2) NOT NULL DEFAULT 0;

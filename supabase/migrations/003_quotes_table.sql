-- Fiyat Teklifleri tablosu
-- line_items JSONB olarak saklanır (ayrı tablo gerekmez, teklif basit yapıdadır)

CREATE TABLE IF NOT EXISTS quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number  TEXT NOT NULL UNIQUE,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  vehicle_info  TEXT,
  quote_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until   DATE,
  status        TEXT NOT NULL DEFAULT 'taslak'
                CHECK (status IN ('taslak', 'gonderildi', 'onaylandi', 'reddedildi')),
  labor_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
  kdv_enabled   BOOLEAN NOT NULL DEFAULT false,
  kdv_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  line_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_date ON quotes(quote_date DESC);

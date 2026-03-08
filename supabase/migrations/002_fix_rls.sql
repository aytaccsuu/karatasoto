-- RLS politikalarini guncelle: anon ve authenticated her ikisi de erisebilsin
-- Bu tek-kullanicili bir sistem oldugu icin, middleware zaten yetkisiz erisimi engelliyor

-- Mevcut politikalari kaldir
DROP POLICY IF EXISTS "authenticated_all" ON customers;
DROP POLICY IF EXISTS "authenticated_all" ON vehicles;
DROP POLICY IF EXISTS "authenticated_all" ON products;
DROP POLICY IF EXISTS "authenticated_all" ON service_records;
DROP POLICY IF EXISTS "authenticated_all" ON service_line_items;
DROP POLICY IF EXISTS "authenticated_all" ON debt_transactions;

-- Yeni politikalar: anon ve authenticated her ikisi de tam erisim
CREATE POLICY "allow_all" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON vehicles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON service_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON service_line_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON debt_transactions
  FOR ALL USING (true) WITH CHECK (true);

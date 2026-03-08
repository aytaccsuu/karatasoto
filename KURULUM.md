# Karatas Oto - Kurulum Rehberi

## 1. Supabase Kurulumu (Veritabani)

1. https://supabase.com adresine gidin
2. "New project" ile ucretsiz hesap olusturun
3. Proje olusturulduktan sonra sol menuden **SQL Editor** acin
4. `supabase/migrations/001_initial_schema.sql` dosyasinin tum icerigini kopyalayin ve SQL Editor'a yapistirip calistirin
5. Sol menuden **Authentication > Users** a gidin
6. "Add user" ile bir kullanici olusturun (e-posta + sifre)
7. Sol menuden **Project Settings > API** acin
8. `Project URL` ve `anon public` key'i kopyalayin

## 2. .env.local Guncelleme

`C:\Users\HP\Desktop\karatasoto\.env.local` dosyasini acin ve doldurun:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1N...
```

## 3. Uygulamayi Calistirma (Lokal Test)

```bash
cd C:\Users\HP\Desktop\karatasoto
npm run dev
```

Tarayicida http://localhost:3000 acin ve Supabase'de olusturdugunuz kullanici ile giris yapin.

## 4. Vercel'e Deploy (Ucretsiz Yayinlama)

1. https://github.com adresinde hesap acin ve repository olusturun
2. Proje klasorunde git baslatip push yapin:
   ```bash
   git init
   git add -A
   git commit -m "ilk kurulum"
   git remote add origin https://github.com/KULLANICI_ADI/karatasoto.git
   git push -u origin main
   ```
3. https://vercel.com adresine gidin, GitHub ile baglayın
4. Repository'yi import edin
5. **Environment Variables** bolumunde su iki degeri ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
6. "Deploy" butonuna basin

Vercel size ucretsiz bir URL verir: `https://karatasoto-xxxx.vercel.app`

## 5. Domain Baglama (Opsiyonel)

Vercel panelinde **Settings > Domains** bolumunden kendi domain'inizi ekleyebilirsiniz.

---

## Sistem Ozeti

- **Musteri Ekle:** Sol menu > Musteriler > Yeni Musteri
- **Arac Ekle:** Musteri detay sayfasindan veya Sol menu > Araclar > Yeni Arac
- **Servis Kaydi Ac:** Sol menu > Servis Kayitlari > Yeni Servis
- **PDF Fis:** Servis detay sayfasindaki "PDF Indir" butonu
- **Excel Rapor:** Sol menu > Raporlar

---

## Sorun Giderme

**"Invalid login credentials" hatasi:** Supabase Auth'da kullanici olusturdunuz mu kontrol edin.

**Sayfalar bos geliyor:** `.env.local` dosyasindaki URL ve KEY dogru mu kontrol edin.

**"Row Level Security" hatasi:** SQL migration'i calistirdiniz mi kontrol edin.

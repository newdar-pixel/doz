# DOZ — Dosyadan öngörüye

DOZ; dava açıldığında öğrenme modu başlatan, gelen belgeleri işleyen, çelişki ve riskleri çıkaran, stratejiyi sürümleyen ve ChatGPT'ye MCP üzerinden bağlanabilen **web + iOS + Android** hukukî karar zekâsı uygulamasıdır.

## Çalışan kapsam

- Tek Expo Router kod tabanı: web, iOS ve Android
- Dava panosu, dava oluşturma ve dava ayrıntısı
- PDF/DOCX/TXT belge yükleme
- Kural tabanlı ön analiz; OpenAI anahtarı varsa ayrıntılı AI analizi
- Çelişki, içtihat araştırma tetikleyicisi, yapılacak iş ve strateji sürümü
- Dilekçe/beyan iskeleti
- REST API + aynı sunucuda `/mcp`
- Çok kullanıcılı veri modeline hazır sahiplik alanları
- Supabase/Postgres + RLS üretim şeması

## 1. Kurulum

```bash
cp .env.example .env
npm install
```

## 2. Sunucuyu çalıştır

```bash
npm run dev:server
```

Sunucu: `http://localhost:8787`  
MCP: `http://localhost:8787/mcp`

## 3. Web ve mobil arayüzü çalıştır

Ayrı Terminal penceresinde:

```bash
cp .env.example apps/client/.env
npm run dev:client
```

Expo ekranında:

- `w`: tarayıcı
- Telefon: Expo Go ile QR kod
- iOS Simulator: `i` (uygun Xcode bulunan destekli Mac gerekir)
- Android Emulator: `a`

Telefon fiziksel cihazsa `EXPO_PUBLIC_API_URL` değerini bilgisayarın yerel IP adresine çevir:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:8787
```

## Giriş

DOZ, Supabase Auth ile e-posta ve şifre üzerinden giriş yapar. Yerelde veya üretimde giriş yapmadan önce istemci için Supabase ortam değişkenlerini tanımlayın.

## OpenAI analizi

Sunucu `.env` dosyasına anahtar eklenirse yüklenen belge kural tabanlı kontrolün yanında ayrıntılı AI analizinden geçer:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
```

Anahtar yoksa uygulama çalışmaya devam eder; yalnızca kural tabanlı ön analiz üretir.

## ChatGPT'ye bağlama

Sunucuyu kalıcı HTTPS adresine yayımladıktan sonra ChatGPT geliştirici modunda özel uygulama oluştur ve MCP adresini gir:

```text
https://api.senin-alanin.com/mcp
```

Üretimde `MCP_API_KEY` zorunlu tutulmalı veya OAuth eklenmelidir.

## Güvenlik notu

Bu sürüm geliştirme/MVP sürümüdür. Gerçek hukuk dosyaları yüklenmeden önce `docs/SECURITY.md` içindeki üretim maddeleri tamamlanmalıdır. Sistem hukuki işlemleri kendiliğinden mahkemeye göndermez; tüm dilekçe ve strateji çıktıları insan onayı gerektirir.

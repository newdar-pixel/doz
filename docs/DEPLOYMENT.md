# Dava OS v0.3 dağıtımı

## 1. Supabase

`supabase/migrations/001_init.sql` yerine güncel `supabase/migrations/001_init_v2.sql` dosyasını SQL Editor'da çalıştır.

İstemci değişkenleri:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Sunucu değişkenleri:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (yalnız sunucu)

## 2. Render API

Repo kökündeki `render.yaml` ile Blueprint oluştur. Gizli değişkenleri Render panelinden gir. `SUPABASE_SECRET_KEY` hiçbir zaman istemciye konmamalıdır.

Canlı API örneği:

```text
https://dava-os-api.onrender.com
```

Sağlık kontrolü:

```text
https://dava-os-api.onrender.com/api/health
```

## 3. Expo web

`apps/client/.env` dosyasını oluştur:

```env
EXPO_PUBLIC_API_URL=https://CANLI-API-ADRESIN
EXPO_PUBLIC_SUPABASE_URL=https://PROJEN.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ardından:

```bash
npm install
cd apps/client
npx eas-cli login
npx expo export --platform web
npx eas-cli deploy --prod
```

## 4. Mobil

```bash
cd apps/client
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

## 5. ChatGPT MCP

Sunucuya `MCP_API_KEY` ve kendi Supabase kullanıcı UUID'nizi `MCP_OWNER_ID` olarak girin. ChatGPT özel uygulamasında API anahtarlı veya OAuth tabanlı kimlik doğrulama kurulmadan kişisel dava verilerini herkese açık MCP olarak bağlamayın.

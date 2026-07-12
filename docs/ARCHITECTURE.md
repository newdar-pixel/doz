# Mimari

## Birincil uygulama tipi

**Interactive-decoupled universal application.** Mobil ve web arayüzü tek Expo Router kod tabanından çıkar; iş mantığı REST/MCP sunucusunda kalır.

```text
Expo Router (Web / iOS / Android)
              │
              ▼
REST API + Belge yükleme
              │
   ┌──────────┼───────────┐
   ▼          ▼           ▼
Dava hafızası Belge analizi Strateji motoru
   │          │           │
   └──────────┴───────────┘
              │
              ▼
         MCP /mcp
              │
              ▼
           ChatGPT
```

## Veri akışı

1. Kullanıcı dava oluşturur.
2. Öğrenme motoru dava türünü sınıflandırır ve başlangıç paketi üretir.
3. Belge yüklenir; metin PDF/DOCX/TXT içinden çıkarılır.
4. Kural tabanlı analiz her zaman çalışır.
5. OpenAI anahtarı varsa belge, somut dava hafızasıyla birlikte AI analizinden geçirilir.
6. Çelişki, risk, süre, araştırma sorguları ve strateji değişiklikleri kaydedilir.
7. Web/mobil panosu ve MCP araçları aynı güncel kaydı kullanır.

## Üretim hedefi

- Veri: Supabase Postgres
- Dosyalar: özel Supabase Storage bucket
- Yetkilendirme: Supabase Auth + RLS
- Sunucu: Render/Fly/Railway/AWS gibi kalıcı HTTPS ortamı
- Web: Expo static export veya EAS Hosting
- Mobil: EAS Build ile iOS/Android

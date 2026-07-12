# Güvenlik kontrol listesi

Bu uygulama sağlık veya alışveriş uygulamasından daha hassas belgeler işleyebilir. Üretime geçmeden önce:

1. Demo kimlik doğrulamayı kapat; Auth sağlayıcısı ve MFA kullan.
2. Her dava, belge ve olay kaydında kullanıcı/organizasyon sahipliğini zorunlu kıl.
3. Postgres ve Storage için RLS politikalarını etkinleştir.
4. Service-role anahtarını hiçbir mobil/web istemcisine koyma.
5. Dosyaları özel bucket'ta sakla; kısa ömürlü imzalı bağlantı üret.
6. MCP'yi anonim bırakma; API key yalnız özel pilot için, nihai sürümde OAuth kullan.
7. Yüklenen dosyalarda tür, boyut, zararlı içerik ve arşiv bombası kontrolleri yap.
8. Orijinal belgeyi değiştirme; SHA-256 özeti ve sürüm kaydı tut.
9. Her AI çıktısını kaynak belge kimlikleriyle ilişkilendir.
10. Silme, dışa aktarma, erişim ve AI çağrıları için denetim kaydı oluştur.
11. Yedekleme, geri yükleme ve olay müdahale planı hazırla.
12. KVKK aydınlatma metni, saklama süresi ve veri işleyen sözleşmelerini belirle.
13. Hukuki taslakların otomatik gönderimini engelle; açık insan onayı iste.

const commonProcedure = [
  "Görev, yetki ve dava şartlarını doğrula",
  "Taraf sıfatı ve temsil yetkisini doğrula",
  "Tebligat ve süre başlangıçlarını kaydet",
  "İddia, savunma ve ispat yükünü ayrı ayrı haritala",
  "Her önemli tespiti belge ve sayfa numarasıyla ilişkilendir",
  "Lehe ve aleyhe içtihadı birlikte değerlendir",
  "Karşı tarafın en güçlü olası argümanını ayrıca üret",
];

const profiles = {
  kamulastirma: {
    label: "Kamulaştırma bedelinin tespiti ve tescil",
    governingLaw: ["2942 sayılı Kamulaştırma Kanunu", "6100 sayılı HMK", "Tebligat mevzuatı", "Faiz mevzuatı"],
    issues: ["Taşınmazın arsa veya arazi niteliği", "Sulu/kuru tarım ve ürün münavebesi", "Verim, fiyat ve üretim giderlerinin doğru yıl verileri", "Kapitalizasyon faizinin gerekçesi", "Objektif değer artışı", "Arta kalan kısımda değer kaybı", "Emsal seçimi ve karşılaştırma", "Faiz başlangıcı ve ödeme mahsupları"],
    commonErrors: ["Taşınmaz niteliğinin eksik araştırılması", "Tarla kirasının üretim giderine mükerrer veya hatalı eklenmesi", "Dava tarihinden farklı yıl verilerinin kullanılması", "Kapitalizasyon faizinin soyut belirlenmesi", "Objektif değer artışının gerekçesiz uygulanması veya reddi", "Bilirkişi heyetinin uzmanlık yönünden yetersizliği", "Komşu parsel ve önceki dosyalarla çelişkinin açıklanmaması"],
    evidence: ["Tapu ve kadastro kayıtları", "Belediye/imar yazıları", "İl Tarım verileri", "DSİ/sulama belgeleri", "Keşif ve bilirkişi raporları", "Emsal satış kayıtları", "Komşu parsel kararları"],
  },
  vergi_ceza: {
    label: "Vergi ceza / VUK 359 bağlantılı dosya",
    governingLaw: ["213 sayılı VUK", "5271 sayılı CMK", "5237 sayılı TCK", "Tebligat mevzuatı"],
    issues: ["Belgenin gerçek işlem ve teslim ilişkisi", "Kullanma/düzenleme fiilinin ayrımı", "Kast ve fail bağlantısı", "Vergi tekniği raporunun delil değeri", "Karşıt inceleme, ödeme, sevk ve teslim kayıtları", "Mütalaa, iddianame ve soruşturma yeterliliği", "Zamanaşımı ve lehe kanun"],
    commonErrors: ["Yalnız rapor sonucuna dayanılması", "Mal ve para hareketinin araştırılmaması", "Şirket yetkililiği ile fiili yönetimin karıştırılması", "Her takvim yılı ve fiil için ayrı değerlendirme yapılmaması", "Lehe delillerin tartışılmaması"],
    evidence: ["Faturalar", "İrsaliye ve kantar kayıtları", "Banka/çek kayıtları", "Müşteri ve tedarikçi beyanları", "Vergi inceleme ekleri", "Ticaret sicili ve yetki belgeleri"],
  },
  ecrimisil: {
    label: "Ecrimisil / haksız işgal tazminatı",
    governingLaw: ["4721 sayılı TMK", "6098 sayılı TBK", "6100 sayılı HMK"],
    issues: ["Mülkiyet veya hak sahipliği", "Haksız kullanım dönemi", "Kötü niyet", "Emsal kira ve kullanım biçimi", "Zarar ve yarar hesabı", "Zamanaşımı"],
    commonErrors: ["İşgal alanı ve süresinin belirsiz bırakılması", "Emsal kiranın somutlaştırılmaması", "Kamulaştırma bedeliyle ecrimisilin karıştırılması", "Dönemsel hesap yapılmaması"],
    evidence: ["Tapu", "Uydu/fotoğraf", "Keşif", "Kurum yazıları", "Emsal kira sözleşmeleri", "Faaliyet ve döküm kayıtları"],
  },
  ceza: {
    label: "Ceza davası",
    governingLaw: ["5271 sayılı CMK", "5237 sayılı TCK", "İsnada özgü özel kanun"],
    issues: ["Suçun maddi ve manevi unsurları", "Fail-fiil bağlantısı", "Hukuka uygun delil", "Savunma hakkı", "Lehe kanun", "Zamanaşımı", "Mahkumiyet için yeterli şüphe standardı"],
    commonErrors: ["Şüpheden sanık yararlanır ilkesinin göz ardı edilmesi", "Delillerin birlikte tartışılmaması", "Fiil ve failin somutlaştırılmaması", "Gerekçesiz zincirleme suç uygulaması"],
    evidence: ["İddianame", "Tanık beyanları", "Bilirkişi raporları", "Dijital/fiziksel deliller", "Kurum kayıtları", "Savunma ve karşı deliller"],
  },
  genel: {
    label: "Genel hukuk davası",
    governingLaw: ["6100 sayılı HMK", "Uyuşmazlığa özgü maddi hukuk"],
    issues: ["Talep sonucu", "Maddi vakıalar", "İspat yükü", "Deliller", "Usuli süreler", "Kanun yolu"],
    commonErrors: ["Talep ve vakıa bağının kurulamaması", "İspat yükünün yanlış kurulması", "Sürelerin kaçırılması", "Belgesiz veya kaynaksız iddia"],
    evidence: ["Dava dilekçesi", "Cevap dilekçesi", "Sözleşmeler", "Resmî kayıtlar", "Tanık ve bilirkişi delilleri"],
  },
};

export function normalizeCaseType(value = "") {
  const text = value.toLocaleLowerCase("tr-TR");
  if (text.includes("kamulaştır")) return "kamulastirma";
  if (text.includes("vuk") || text.includes("vergi") || text.includes("sahte fatura")) return "vergi_ceza";
  if (text.includes("ecrimisil") || text.includes("haksız işgal")) return "ecrimisil";
  if (text.includes("ceza") || text.includes("asliye ceza") || text.includes("ağır ceza")) return "ceza";
  return "genel";
}

export function buildLearningPack(caseType) {
  const key = normalizeCaseType(caseType);
  const profile = profiles[key];
  return {
    profileKey: key,
    profileLabel: profile.label,
    governingLaw: profile.governingLaw,
    legalIssues: profile.issues,
    commonErrors: profile.commonErrors,
    expectedEvidence: profile.evidence,
    procedureChecklist: commonProcedure,
    initialStrategy: ["Dosyadaki mevcut belgeleri tür ve hukuki işlevine göre sınıflandır", "Eksik delilleri erken aşamada tespit et", "İlk kritik belge geldiğinde konuya özgü içtihat taraması başlat", "Karşı tarafın muhtemel savunmasını ayrı başlıkta üret", "Her strateji değişikliğini sürümleyerek nedenini kaydet"],
  };
}

const DATE_RE = /\b(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])[./-](?:19|20)\d{2}\b/g;
const FILE_RE = /\b(20\d{2})\s*\/\s*(\d+)\s*(?:E\.?|K\.?)?/gi;
const PARCEL_RE = /\b(\d+)\s*ada\s*(\d+)\s*parsel\b/gi;
const ARTICLE_RE = /\b(?:HMK|CMK|TCK|VUK|TBK|TMK|KK)\s*(?:m\.?|madde)?\s*(\d+(?:\/[A-Za-z0-9-]+)?)/gi;

const unique = (values) => [...new Set(values.filter(Boolean))];

export function extractSignals(content = "") {
  return {
    dates: unique(content.match(DATE_RE) ?? []),
    fileNumbers: unique([...content.matchAll(FILE_RE)].map((m) => `${m[1]}/${m[2]}`)),
    parcels: unique([...content.matchAll(PARCEL_RE)].map((m) => `${m[1]} ada ${m[2]} parsel`)),
    articles: unique([...content.matchAll(ARTICLE_RE)].map((m) => m[0].replace(/\s+/g, " "))),
  };
}

const researchRules = [
  { test: /kapitalizasyon|kapitalizasyon faizi/i, issue: "Kapitalizasyon faizinin belirlenmesi", query: "kapitalizasyon faizinin somut gerekçelerle belirlenmesi kamulaştırma" },
  { test: /tarla kirası|arazi kirası/i, issue: "Üretim giderlerinde tarla kirası", query: "kamulaştırma üretim gideri tarla kirası Yargıtay" },
  { test: /sulu|kuru tarım|sulama/i, issue: "Sulu-kuru arazi ayrımı", query: "kamulaştırma sulu kuru tarım araştırma yükümlülüğü" },
  { test: /objektif değer|objektif artış/i, issue: "Objektif değer artışı", query: "kamulaştırma objektif değer artışı gerekçe" },
  { test: /vergi tekniği raporu|vtr/i, issue: "Vergi tekniği raporunun delil niteliği", query: "VUK 359 yalnız vergi tekniği raporuna dayanılarak mahkumiyet" },
  { test: /tebligat|e-tebligat|elektronik tebligat/i, issue: "Tebligat geçerliliği ve süre", query: "elektronik tebligat usulsüzlük öğrenme tarihi süre" },
  { test: /zamanaşımı/i, issue: "Zamanaşımı", query: "uyuşmazlık türüne göre güncel zamanaşımı içtihadı" },
  { test: /bilirkişi/i, issue: "Bilirkişi raporunun denetlenebilirliği", query: "bilirkişi raporu denetime elverişli gerekçeli olma zorunluluğu" },
];

export function detectResearchTriggers(content = "") {
  return researchRules.filter((r) => r.test.test(content)).map(({ issue, query }) => ({ issue, query, status: "recommended" }));
}

function sentenceSplit(text) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length >= 20);
}

function buildRuleSummary(content, signals, documentType) {
  const sentences = sentenceSplit(content);
  const excerpt = sentences.slice(0, 2).join(" ").slice(0, 620);
  const detected = [
    signals.fileNumbers.length ? `${signals.fileNumbers.length} dosya numarası` : null,
    signals.dates.length ? `${signals.dates.length} tarih` : null,
    signals.articles.length ? `${signals.articles.length} mevzuat atfı` : null,
    signals.parcels.length ? `${signals.parcels.length} taşınmaz bilgisi` : null,
  ].filter(Boolean);
  const prefix = `${documentType || "Belge"} için kural tabanlı ilk okuma tamamlandı.`;
  const signalText = detected.length ? ` Tespit edilen unsurlar: ${detected.join(", ")}.` : "";
  return `${prefix}${signalText}${excerpt ? ` Belge özeti: ${excerpt}` : " Belge metninde özet üretmeye yetecek cümle bulunamadı; asıl metni kontrol edin."}`;
}

export function findPotentialContradictions(newContent, priorDocuments = []) {
  const newSentences = sentenceSplit(newContent);
  const results = [];
  const pairs = [
    [/(sulu|sulama imkânı vardır)/i, /(kuru|sulama imkânı yoktur)/i, "Sulu/kuru arazi niteliği"],
    [/(ödeme yapılmıştır|bedel ödenmiştir)/i, /(ödeme yapılmamıştır|bedel ödenmemiştir)/i, "Ödeme olgusu"],
    [/(mal teslim edilmiştir|gerçek mal alımı)/i, /(mal teslim edilmemiştir|sahte işlem)/i, "Mal teslimi / işlemin gerçekliği"],
    [/(mücavir alan içindedir|imar alanındadır)/i, /(mücavir alan dışındadır|imar dışıdır)/i, "İmar ve mücavir alan durumu"],
  ];
  for (const prior of priorDocuments) {
    const oldSentences = sentenceSplit(prior.content ?? "");
    for (const [positive, negative, topic] of pairs) {
      const np = newSentences.find((s) => positive.test(s));
      const nn = newSentences.find((s) => negative.test(s));
      const op = oldSentences.find((s) => positive.test(s));
      const on = oldSentences.find((s) => negative.test(s));
      if (np && on) results.push({ topic, newStatement: np, priorStatement: on, priorDocumentId: prior.id, confidence: "medium" });
      if (nn && op) results.push({ topic, newStatement: nn, priorStatement: op, priorDocumentId: prior.id, confidence: "medium" });
    }
  }
  return results.slice(0, 20);
}

export function buildDocumentAssessment({ content, documentType, priorDocuments }) {
  const signals = extractSignals(content);
  const researchTriggers = detectResearchTriggers(content);
  const contradictions = findPotentialContradictions(content, priorDocuments);
  const actionItems = ["Belgedeki vakıa, talep ve tarihleri asıl nüsha ile karşılaştır"];
  if (/bilirkişi/i.test(documentType) || /bilirkişi/i.test(content)) {
    actionItems.push("Bilirkişi raporuna itiraz süresini doğrula", "Ara karar sorularının tamamının cevaplanıp cevaplanmadığını kontrol et", "Hesap cetvelini matematiksel ve veri kaynağı yönünden denetle");
  }
  if (/tensip|ara karar/i.test(documentType) || /kesin süre|iki hafta|bir hafta/i.test(content)) actionItems.push("Belgedeki kesin ve kanuni süreleri takvime işle");
  if (contradictions.length) actionItems.push("Tespit edilen çelişkiler için açıklama ve karşı delil hazırla");
  if (researchTriggers.length) actionItems.push("Önerilen hukuki sorunlarda güncel lehe ve aleyhe içtihat taraması yap");
  return {
    signals,
    researchTriggers,
    contradictions,
    actionItems: unique(actionItems),
    favorableFindings: [],
    adverseFindings: [],
    deadlines: [],
    summary: buildRuleSummary(content, signals, documentType),
    documentRole: "belge",
    confidenceNote: "Kural tabanlı ön analizdir; belge aslı ve uzman denetimiyle doğrulanmalıdır.",
  };
}

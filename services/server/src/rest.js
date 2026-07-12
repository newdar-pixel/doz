import express from "express";
import cors from "cors";
import multer from "multer";
import { buildLearningPack } from "./learning.js";
import { buildDocumentAssessment } from "./analyzer.js";
import { analyzeWithAI, mergeAssessments } from "./ai.js";
import { extractText, persistUpload } from "./extract.js";
import { resolveUser } from "./auth.js";
import {
  addDocumentRecord,
  createCaseRecord,
  getCaseDocuments,
  getCaseEvents,
  getCaseRecord,
  getDocumentRecord,
  listCaseRecords,
  searchRecords,
  updateCaseRecord,
} from "./store.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function buildDashboard(ownerId, caseId) {
  const targetCase = await getCaseRecord(ownerId, caseId);
  if (!targetCase) return null;
  const storedDocuments = (await getCaseDocuments(ownerId, caseId)) ?? [];
  // Older uploads may predate the visible rule-based summary. Enrich them at
  // read time as well, so a user does not need to upload the same file again.
  const documents = storedDocuments.map((document) => {
    if (document.assessment?.summary) return document;
    return {
      ...document,
      assessment: buildDocumentAssessment({
        content: document.content ?? "",
        documentType: document.documentType ?? "Diğer",
        priorDocuments: storedDocuments.filter((item) => item.id !== document.id),
      }),
    };
  });
  const events = await getCaseEvents(ownerId, caseId);
  const contradictions = documents.flatMap((d) => d.assessment?.contradictions ?? []);
  const researchTriggers = documents.flatMap((d) => d.assessment?.researchTriggers ?? []);
  const actionItems = [...new Set(documents.flatMap((d) => d.assessment?.actionItems ?? []))];
  const favorableFindings = documents.flatMap((d) => d.assessment?.favorableFindings ?? []);
  const adverseFindings = documents.flatMap((d) => d.assessment?.adverseFindings ?? []);
  const deadlines = documents.flatMap((d) => d.assessment?.deadlines ?? []);
  return {
    case: targetCase,
    documentCount: documents.length,
    documents: documents.map(({ content, ...d }) => ({ ...d, textLength: content?.length ?? 0 })),
    contradictions,
    researchTriggers,
    actionItems,
    favorableFindings,
    adverseFindings,
    deadlines,
    events: events.slice(0, 30),
  };
}

export function createRestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => res.json({ name: "Dava OS Universal", version: "0.3.0", status: "ok", api: "/api", mcp: "/mcp" }));
  app.get("/api/health", (_req, res) => res.json({ ok: true, now: new Date().toISOString(), aiEnabled: Boolean(process.env.OPENAI_API_KEY) }));

  app.use("/api", asyncRoute(async (req, _res, next) => {
    req.user = await resolveUser(req);
    next();
  }));

  app.get("/api/session", (req, res) => res.json({ user: req.user }));

  app.get("/api/cases", asyncRoute(async (req, res) => {
    const cases = await listCaseRecords(req.user.id);
    // Supabase case rows do not contain an embedded documentIds field. Keep the
    // API shape consistent with the local backend so portfolio counters work.
    const withDocumentIds = await Promise.all(cases.map(async (record) => ({
      ...record,
      documentIds: ((await getCaseDocuments(req.user.id, record.id)) ?? []).map((document) => document.id),
    })));
    res.json({ cases: withDocumentIds });
  }));

  app.post("/api/cases", asyncRoute(async (req, res) => {
    const { title, caseType, court, fileNumber, clientSide, objective, summary } = req.body ?? {};
    if (!title || !caseType) return res.status(400).json({ error: "title ve caseType zorunlu" });
    const learningPack = buildLearningPack(caseType);
    const record = await createCaseRecord(req.user.id, {
      title, caseType, court, fileNumber, clientSide, objective, summary,
      learningPack,
      strategy: learningPack.initialStrategy,
    });
    res.status(201).json({ case: record });
  }));

  app.get("/api/cases/:caseId", asyncRoute(async (req, res) => {
    const targetCase = await getCaseRecord(req.user.id, req.params.caseId);
    if (!targetCase) return res.status(404).json({ error: "Dava bulunamadı" });
    res.json({ case: targetCase });
  }));

  app.get("/api/cases/:caseId/dashboard", asyncRoute(async (req, res) => {
    const dashboard = await buildDashboard(req.user.id, req.params.caseId);
    if (!dashboard) return res.status(404).json({ error: "Dava bulunamadı" });
    res.json(dashboard);
  }));

  app.post("/api/cases/:caseId/documents", upload.single("file"), asyncRoute(async (req, res) => {
    const targetCase = await getCaseRecord(req.user.id, req.params.caseId);
    if (!targetCase) return res.status(404).json({ error: "Dava bulunamadı" });

    let extracted = String(req.body.content ?? "").trim();
    let storedFile = null;
    let extractionWarning = null;
    if (req.file) {
      storedFile = await persistUpload(req.file, req.params.caseId, req.user.id);
      try {
        const fileText = await extractText(req.file);
        if (fileText.trim()) extracted = [extracted, fileText].filter(Boolean).join("\n\n");
        else extractionWarning = "Bu dosya türünden otomatik metin çıkarılamadı; belge metnini ayrıca yapıştırın.";
      } catch (error) {
        extractionWarning = `Metin çıkarma hatası: ${error.message}`;
      }
    }
    if (extracted.length < 20) return res.status(400).json({ error: extractionWarning ?? "Belge metni en az 20 karakter olmalı" });

    const priorDocuments = (await getCaseDocuments(req.user.id, req.params.caseId)) ?? [];
    const ruleAssessment = buildDocumentAssessment({
      content: extracted,
      documentType: req.body.documentType ?? "Diğer",
      priorDocuments,
    });
    let aiAssessment = null;
    try {
      aiAssessment = await analyzeWithAI({
        caseRecord: targetCase,
        content: extracted,
        documentType: req.body.documentType ?? "Diğer",
        ruleAssessment,
      });
    } catch (error) {
      console.error("AI analysis failed", error);
    }
    const assessment = mergeAssessments(ruleAssessment, aiAssessment);
    if (extractionWarning) assessment.warnings = [...(assessment.warnings ?? []), extractionWarning];

    const { document } = await addDocumentRecord(req.user.id, req.params.caseId, {
      title: req.body.title || req.file?.originalname || "Belge",
      documentType: req.body.documentType || "Diğer",
      documentDate: req.body.documentDate || null,
      source: req.body.source || null,
      content: extracted,
      file: storedFile,
      assessment,
    });

    const priorStrategy = Array.isArray(targetCase.strategy) ? targetCase.strategy : [];
    const additions = (assessment.actionItems ?? []).filter((item) => !priorStrategy.includes(item));
    const updatedCase = await updateCaseRecord(req.user.id, req.params.caseId, { strategy: [...priorStrategy, ...additions] }, "strategy.updated");
    res.status(201).json({ document, assessment, case: updatedCase });
  }));

  app.post("/api/cases/:caseId/drafts", asyncRoute(async (req, res) => {
    const targetCase = await getCaseRecord(req.user.id, req.params.caseId);
    const documents = await getCaseDocuments(req.user.id, req.params.caseId);
    if (!targetCase || !documents) return res.status(404).json({ error: "Dava bulunamadı" });
    const draftType = req.body?.draftType ?? "genel";
    const contradictions = documents.flatMap((d) => d.assessment?.contradictions ?? []);
    const triggers = documents.flatMap((d) => d.assessment?.researchTriggers ?? []);
    const outline = {
      draftType,
      objective: req.body?.objective ?? targetCase.objective ?? "Dosyanın güncel hukuki hedefi",
      sections: [
        { title: "Dosya ve usul özeti", sources: documents.slice(0, 8).map((d) => d.id) },
        { title: "Tartışmalı maddi vakıalar", items: contradictions.map((c) => c.topic), sources: contradictions.map((c) => c.priorDocumentId).filter(Boolean) },
        { title: "Lehe bulgular", items: documents.flatMap((d) => d.assessment?.favorableFindings ?? []).map((x) => x.finding) },
        { title: "Aleyhe hususlar ve cevaplar", items: documents.flatMap((d) => d.assessment?.adverseFindings ?? []).map((x) => x.finding) },
        { title: "Hukuki değerlendirme ve içtihat ihtiyacı", items: [...new Set(triggers.map((t) => t.issue))] },
        { title: "Deliller", items: documents.map((d) => `${d.title} (${d.id})`) },
        { title: "Sonuç ve talep", items: ["Talebi dosya aşamasına uygun, somut ve ölçülü kur"] },
      ],
      warnings: ["Taslak otomatik olarak mahkemeye gönderilmemelidir.", "Her vakıa ve içtihat belge aslıyla doğrulanmalıdır."],
    };
    res.json({ outline });
  }));

  app.get("/api/search", asyncRoute(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.status(400).json({ error: "Arama en az 2 karakter olmalı" });
    res.json({ results: await searchRecords(req.user.id, q, req.query.caseId ? String(req.query.caseId) : undefined) });
  }));

  app.get("/api/records/:id", asyncRoute(async (req, res) => {
    const item = (await getCaseRecord(req.user.id, req.params.id)) ?? (await getDocumentRecord(req.user.id, req.params.id));
    if (!item) return res.status(404).json({ error: "Kayıt bulunamadı" });
    res.json({ record: item });
  }));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status ?? 500).json({ error: error.message ?? "Sunucu hatası" });
  });
  return app;
}

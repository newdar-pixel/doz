import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const DATA_FILE = resolve(process.env.DATA_FILE ?? "./data/db.json");
const useSupabase = (process.env.DATA_BACKEND ?? "json") === "supabase";

const emptyDb = () => ({ schemaVersion: 3, cases: {}, documents: {}, events: [] });

function requireSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli");
  return { url: url.replace(/\/$/, ""), secret };
}

async function sb(path, options = {}) {
  const { url, secret } = requireSupabaseConfig();
  const headers = {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    "content-type": "application/json",
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase hatası (${response.status})`);
  return data;
}

const caseFromDb = (r) => r && ({
  id: r.id,
  ownerId: r.owner_id,
  title: r.title,
  caseType: r.case_type,
  court: r.court,
  fileNumber: r.file_number,
  clientSide: r.client_side,
  objective: r.objective,
  summary: r.summary,
  status: r.status,
  learningStatus: r.learning_status,
  learningPack: r.learning_pack ?? {},
  strategy: r.strategy ?? [],
  strategyVersion: r.strategy_version ?? 1,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const documentFromDb = (r) => r && ({
  id: r.id,
  caseId: r.case_id,
  ownerId: r.owner_id,
  title: r.title,
  documentType: r.document_type,
  documentDate: r.document_date,
  source: r.source,
  content: r.content,
  assessment: r.assessment ?? {},
  file: r.storage_path ? {
    path: r.storage_path,
    filename: r.original_filename,
    mimeType: r.mime_type,
    size: r.file_size_bytes,
    sha256: r.sha256,
  } : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const eventFromDb = (r) => ({
  id: r.id,
  ownerId: r.owner_id,
  caseId: r.case_id,
  documentId: r.document_id,
  type: r.event_type,
  title: r.title,
  payload: r.payload ?? {},
  at: r.created_at,
});

async function loadDb() {
  try { return JSON.parse(await readFile(DATA_FILE, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return emptyDb(); throw error; }
}

async function saveDb(db) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const temp = `${DATA_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

function owns(item, ownerId) { return item && item.ownerId === ownerId; }

async function insertEvent(ownerId, caseId, type, payload = {}, documentId = null) {
  if (!useSupabase) return;
  await sb("case_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ owner_id: ownerId, case_id: caseId, document_id: documentId, event_type: type, payload }),
  });
}

export async function createCaseRecord(ownerId, payload) {
  if (useSupabase) {
    const rows = await sb("cases", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        owner_id: ownerId,
        title: payload.title,
        case_type: payload.caseType,
        court: payload.court || null,
        file_number: payload.fileNumber || null,
        client_side: payload.clientSide || null,
        objective: payload.objective || null,
        summary: payload.summary || null,
        learning_status: "completed",
        learning_pack: payload.learningPack ?? {},
        strategy: payload.strategy ?? [],
        strategy_version: 1,
      }),
    });
    const record = caseFromDb(rows[0]);
    await insertEvent(ownerId, record.id, "case.created", {});
    return record;
  }
  const db = await loadDb();
  const now = new Date().toISOString();
  const id = `case_${randomUUID()}`;
  const record = { id, ownerId, createdAt: now, updatedAt: now, status: "active", strategyVersion: 1, documentIds: [], ...payload };
  db.cases[id] = record;
  db.events.push({ id: randomUUID(), ownerId, caseId: id, type: "case.created", at: now, payload: {} });
  await saveDb(db);
  return record;
}

export async function getCaseRecord(ownerId, caseId) {
  if (useSupabase) {
    const rows = await sb(`cases?id=eq.${encodeURIComponent(caseId)}&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`);
    return caseFromDb(rows[0]);
  }
  const db = await loadDb(); const item = db.cases[caseId]; return owns(item, ownerId) ? item : null;
}

export async function listCaseRecords(ownerId) {
  if (useSupabase) {
    const rows = await sb(`cases?owner_id=eq.${encodeURIComponent(ownerId)}&order=updated_at.desc`);
    return rows.map(caseFromDb);
  }
  const db = await loadDb();
  return Object.values(db.cases).filter((item) => owns(item, ownerId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function addDocumentRecord(ownerId, caseId, payload) {
  if (useSupabase) {
    const rows = await sb("documents", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        case_id: caseId,
        owner_id: ownerId,
        title: payload.title,
        document_type: payload.documentType,
        document_date: payload.documentDate || null,
        source: payload.source || null,
        storage_path: payload.file?.path || null,
        original_filename: payload.file?.filename || null,
        mime_type: payload.file?.mimeType || null,
        file_size_bytes: payload.file?.size || null,
        sha256: payload.file?.sha256 || null,
        extraction_status: "completed",
        content: payload.content,
        assessment: payload.assessment ?? {},
      }),
    });
    const document = documentFromDb(rows[0]);
    const currentCase = await getCaseRecord(ownerId, caseId);
    await updateCaseRecord(ownerId, caseId, { strategyVersion: (currentCase?.strategyVersion ?? 1) + 1 }, "document.ingested");
    await insertEvent(ownerId, caseId, "document.ingested", { title: document.title }, document.id);
    return { document, case: await getCaseRecord(ownerId, caseId) };
  }
  const db = await loadDb();
  const targetCase = db.cases[caseId];
  if (!owns(targetCase, ownerId)) throw new Error(`Dava bulunamadı: ${caseId}`);
  const now = new Date().toISOString();
  const id = `doc_${randomUUID()}`;
  const document = { id, ownerId, caseId, createdAt: now, ...payload };
  db.documents[id] = document;
  targetCase.documentIds.push(id);
  targetCase.updatedAt = now;
  targetCase.strategyVersion += 1;
  db.events.push({ id: randomUUID(), ownerId, caseId, documentId: id, type: "document.ingested", at: now, payload: { title: document.title } });
  await saveDb(db);
  return { document, case: targetCase };
}

export async function getCaseDocuments(ownerId, caseId) {
  if (useSupabase) {
    const rows = await sb(`documents?owner_id=eq.${encodeURIComponent(ownerId)}&case_id=eq.${encodeURIComponent(caseId)}&order=created_at.asc`);
    return rows.map(documentFromDb);
  }
  const db = await loadDb(); const targetCase = db.cases[caseId];
  if (!owns(targetCase, ownerId)) return null;
  return targetCase.documentIds.map((id) => db.documents[id]).filter((item) => owns(item, ownerId));
}

export async function getDocumentRecord(ownerId, documentId) {
  if (useSupabase) {
    const rows = await sb(`documents?id=eq.${encodeURIComponent(documentId)}&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`);
    return documentFromDb(rows[0]);
  }
  const db = await loadDb(); const item = db.documents[documentId]; return owns(item, ownerId) ? item : null;
}

export async function getCaseEvents(ownerId, caseId) {
  if (useSupabase) {
    const rows = await sb(`case_events?owner_id=eq.${encodeURIComponent(ownerId)}&case_id=eq.${encodeURIComponent(caseId)}&order=created_at.desc`);
    return rows.map(eventFromDb);
  }
  const db = await loadDb(); return db.events.filter((e) => e.ownerId === ownerId && e.caseId === caseId).sort((a, b) => b.at.localeCompare(a.at));
}

export async function updateCaseRecord(ownerId, caseId, patch, eventType = "case.updated") {
  if (useSupabase) {
    const body = {};
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.summary !== undefined) body.summary = patch.summary;
    if (patch.strategy !== undefined) body.strategy = patch.strategy;
    if (patch.strategyVersion !== undefined) body.strategy_version = patch.strategyVersion;
    if (patch.learningPack !== undefined) body.learning_pack = patch.learningPack;
    const rows = await sb(`cases?id=eq.${encodeURIComponent(caseId)}&owner_id=eq.${encodeURIComponent(ownerId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const updated = caseFromDb(rows[0]);
    await insertEvent(ownerId, caseId, eventType, patch);
    return updated;
  }
  const db = await loadDb(); const targetCase = db.cases[caseId];
  if (!owns(targetCase, ownerId)) throw new Error(`Dava bulunamadı: ${caseId}`);
  const now = new Date().toISOString(); Object.assign(targetCase, patch, { updatedAt: now });
  db.events.push({ id: randomUUID(), ownerId, caseId, type: eventType, at: now, payload: patch });
  await saveDb(db); return targetCase;
}

export async function searchRecords(ownerId, query, caseId) {
  if (useSupabase) {
    const [cases, documents] = await Promise.all([listCaseRecords(ownerId), caseId ? getCaseDocuments(ownerId, caseId) : sb(`documents?owner_id=eq.${encodeURIComponent(ownerId)}&order=created_at.desc`).then((rows) => rows.map(documentFromDb))]);
    const q = query.toLocaleLowerCase("tr-TR");
    const results = [];
    for (const item of cases) {
      if (caseId && item.id !== caseId) continue;
      const text = [item.title, item.caseType, item.court, item.fileNumber, item.clientSide, item.summary].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
      if (text.includes(q)) results.push({ id: item.id, type: "case", title: item.title, snippet: text.slice(0, 240) });
    }
    for (const item of documents ?? []) {
      const text = [item.title, item.documentType, item.content].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
      const index = text.indexOf(q);
      if (index >= 0) results.push({ id: item.id, type: "document", title: item.title, caseId: item.caseId, snippet: text.slice(Math.max(0, index - 100), index + q.length + 180) });
    }
    return results.slice(0, 50);
  }
  const db = await loadDb(); const q = query.toLocaleLowerCase("tr-TR"); const results = [];
  for (const item of Object.values(db.cases)) {
    if (!owns(item, ownerId) || (caseId && item.id !== caseId)) continue;
    const text = [item.title, item.caseType, item.court, item.fileNumber, item.clientSide, item.summary].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    if (text.includes(q)) results.push({ id: item.id, type: "case", title: item.title, snippet: text.slice(0, 240) });
  }
  for (const item of Object.values(db.documents)) {
    if (!owns(item, ownerId) || (caseId && item.caseId !== caseId)) continue;
    const text = [item.title, item.documentType, item.content].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    const index = text.indexOf(q);
    if (index >= 0) results.push({ id: item.id, type: "document", title: item.title, caseId: item.caseId, snippet: text.slice(Math.max(0, index - 100), index + q.length + 180) });
  }
  return results.slice(0, 50);
}

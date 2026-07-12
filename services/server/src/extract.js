import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve } from "node:path";

const require = createRequire(import.meta.url);
// Import the parser implementation directly. Importing pdf-parse's package
// entrypoint from ESM can execute its CLI debug fixture loader.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function safeFilename(name) {
  return `${Date.now()}-${String(name || "belge").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

async function persistToSupabase(file, caseId, ownerId) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase Storage ayarları eksik");
  const objectPath = `${ownerId}/${caseId}/${safeFilename(file.originalname)}`;
  const response = await fetch(`${url}/storage/v1/object/case-documents/${encodeURI(objectPath)}`, {
    method: "POST",
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "content-type": file.mimetype || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file.buffer,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Belge deposuna yükleme başarısız (${response.status}): ${text}`);
  }
  return { path: objectPath, filename: file.originalname, mimeType: file.mimetype, size: file.size, sha256: sha256(file.buffer) };
}

export async function persistUpload(file, caseId, ownerId) {
  if (!file) return null;
  if ((process.env.DATA_BACKEND ?? "json") === "supabase") return persistToSupabase(file, caseId, ownerId);
  const uploadDir = resolve(process.env.UPLOAD_DIR ?? "./data/uploads", caseId);
  await mkdir(uploadDir, { recursive: true });
  const safeName = safeFilename(file.originalname);
  const path = resolve(uploadDir, safeName);
  await writeFile(path, file.buffer);
  return { path, filename: file.originalname, mimeType: file.mimetype, size: file.size, sha256: sha256(file.buffer) };
}

export async function extractText(file) {
  if (!file) return "";
  const ext = extname(file.originalname).toLowerCase();
  if (file.mimetype.startsWith("text/") || [".txt", ".md", ".csv"].includes(ext)) return file.buffer.toString("utf8");
  if (file.mimetype === "application/pdf" || ext === ".pdf") {
    const result = await pdfParse(file.buffer);
    return result.text ?? "";
  }
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value ?? "";
  }
  return "";
}

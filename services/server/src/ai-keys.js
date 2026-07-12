import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const localConnections = new Map();
const useSupabase = (process.env.DATA_BACKEND ?? "json") === "supabase";

function encryptionKey() {
  const secret = process.env.AI_KEY_ENCRYPTION_KEY;
  if (!secret) throw new Error("AI anahtar kasası yapılandırılmamış. AI_KEY_ENCRYPTION_KEY ortam değişkenini ekleyin.");
  return createHash("sha256").update(secret).digest();
}

function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { encryptedKey: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

function decrypt(record) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(record.iv, "base64"));
  decipher.setAuthTag(Buffer.from(record.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(record.encryptedKey, "base64")), decipher.final()]).toString("utf8");
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase ortam değişkenleri eksik");
  return { url, secret };
}

async function request(path, options = {}) {
  const { url, secret } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `AI ayarı kaydedilemedi (${response.status})`);
  return data;
}

export async function saveUserAIKey(ownerId, apiKey) {
  const value = String(apiKey ?? "").trim();
  if (value.length < 20) throw new Error("Geçerli bir OpenAI API anahtarı girin.");
  const encrypted = encrypt(value);
  if (!useSupabase) { localConnections.set(ownerId, encrypted); return; }
  await request("user_ai_connections", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ owner_id: ownerId, provider: "openai", encrypted_key: encrypted.encryptedKey, iv: encrypted.iv, auth_tag: encrypted.authTag, model: "gpt-5" }),
  });
}

export async function getUserAIConnection(ownerId) {
  let record;
  if (!useSupabase) record = localConnections.get(ownerId);
  else record = (await request(`user_ai_connections?owner_id=eq.${encodeURIComponent(ownerId)}&select=encrypted_key,iv,auth_tag,model&limit=1`))[0];
  if (!record) return null;
  const normalized = record.encryptedKey ? record : { encryptedKey: record.encrypted_key, iv: record.iv, authTag: record.auth_tag, model: record.model };
  return { apiKey: decrypt(normalized), model: normalized.model || "gpt-5" };
}

export async function getUserAIStatus(ownerId) {
  if (!useSupabase) return { connected: localConnections.has(ownerId), provider: "openai", model: "gpt-5" };
  const rows = await request(`user_ai_connections?owner_id=eq.${encodeURIComponent(ownerId)}&select=provider,model,updated_at&limit=1`);
  const record = rows[0];
  return { connected: Boolean(record), provider: record?.provider ?? "openai", model: record?.model ?? "gpt-5", updatedAt: record?.updated_at ?? null };
}

export async function removeUserAIKey(ownerId) {
  if (!useSupabase) { localConnections.delete(ownerId); return; }
  await request(`user_ai_connections?owner_id=eq.${encodeURIComponent(ownerId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

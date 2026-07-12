import { Platform } from "react-native";
import { getSession } from "./session";

const defaultUrl = Platform.OS === "web" ? "http://localhost:8787" : "http://localhost:8787";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultUrl;

async function request(path, options = {}) {
  const session = await getSession();
  if (!session?.access_token) throw new Error("Oturum bulunamadı. Yeniden giriş yapın.");
  const headers = { ...(options.headers ?? {}), Authorization: `Bearer ${session.access_token}` };
  if (!(options.body instanceof FormData) && options.body != null) headers["content-type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `İstek başarısız (${response.status})`);
  return data;
}

export const api = {
  health: () => fetch(`${API_URL}/api/health`).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `İstek başarısız (${response.status})`);
    return data;
  }),
  getAIConnection: () => request("/api/ai/connection"),
  saveAIConnection: (apiKey) => request("/api/ai/connection", { method: "PUT", body: JSON.stringify({ apiKey }) }),
  removeAIConnection: () => request("/api/ai/connection", { method: "DELETE" }),
  listCases: () => request("/api/cases"),
  createCase: (payload) => request("/api/cases", { method: "POST", body: JSON.stringify(payload) }),
  getDashboard: (id) => request(`/api/cases/${id}/dashboard`),
  createDraft: (id, payload) => request(`/api/cases/${id}/drafts`, { method: "POST", body: JSON.stringify(payload) }),
  uploadDocument: async (caseId, fields, asset) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => value != null && form.append(key, String(value)));
    if (asset) {
      if (Platform.OS === "web" && asset.file) form.append("file", asset.file, asset.name || "belge");
      else form.append("file", { uri: asset.uri, name: asset.name || "belge", type: asset.mimeType || "application/octet-stream" });
    }
    return request(`/api/cases/${caseId}/documents`, { method: "POST", body: form });
  },
  search: (q, caseId) => request(`/api/search?q=${encodeURIComponent(q)}${caseId ? `&caseId=${encodeURIComponent(caseId)}` : ""}`),
};

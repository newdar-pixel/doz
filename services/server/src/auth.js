export async function resolveUser(req) {
  if ((process.env.AUTH_MODE ?? "demo") === "demo") {
    return { id: req.header?.("x-user-id") || process.env.DEMO_USER_ID || "demo-user", email: "demo@davaos.local", mode: "demo" };
  }
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw Object.assign(new Error("Kimlik doğrulama gerekli"), { status: 401 });
  const url = process.env.SUPABASE_URL;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishable) throw new Error("Supabase ortam değişkenleri eksik");
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: publishable },
  });
  if (!response.ok) throw Object.assign(new Error("Geçersiz veya süresi dolmuş oturum"), { status: 401 });
  const user = await response.json();
  return { id: user.id, email: user.email, mode: "supabase", token };
}

export function resolveMcpUser(req) {
  const configured = process.env.MCP_API_KEY;
  if (!configured) throw Object.assign(new Error("MCP_API_KEY yapılandırılmamış"), { status: 503 });
  const auth = req.headers.authorization ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const headerKey = req.headers["x-api-key"] ?? "";
  if (bearer !== configured && headerKey !== configured) throw Object.assign(new Error("MCP yetkilendirmesi başarısız"), { status: 401 });
  const ownerId = process.env.MCP_OWNER_ID;
  if (!ownerId) throw Object.assign(new Error("MCP_OWNER_ID yapılandırılmamış"), { status: 503 });
  return { id: ownerId };
}

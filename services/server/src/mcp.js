import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { resolveMcpUser } from "./auth.js";
import { buildLearningPack } from "./learning.js";
import {
  createCaseRecord,
  getCaseDocuments,
  getCaseRecord,
  getDocumentRecord,
  listCaseRecords,
  searchRecords,
} from "./store.js";

const response = (data, text) => ({ structuredContent: data, content: [{ type: "text", text: text ?? JSON.stringify(data) }] });

function createMcpServer(ownerId) {
  const server = new McpServer({ name: "dava-os-universal", version: "0.3.0" });

  server.registerTool("list_cases", {
    title: "Dava dosyalarını listele",
    description: "Use this when kullanıcı kendi dava dosyalarını görmek veya doğru dava kimliğini bulmak istiyor.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async () => response({ cases: await listCaseRecords(ownerId) }));

  server.registerTool("create_case", {
    title: "Dava oluştur ve öğrenme modunu başlat",
    description: "Use this when kullanıcı yeni dava açmak ve dava türüne özgü öğrenme paketini başlatmak istiyor.",
    inputSchema: {
      title: z.string().min(3), caseType: z.string().min(2), court: z.string().optional(),
      fileNumber: z.string().optional(), clientSide: z.string().optional(), objective: z.string().optional(), summary: z.string().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async (args) => {
    const learningPack = buildLearningPack(args.caseType);
    const item = await createCaseRecord(ownerId, { ...args, learningPack, strategy: learningPack.initialStrategy });
    return response({ case: item }, `Dava oluşturuldu: ${item.title}`);
  });

  server.registerTool("get_case_dashboard", {
    title: "Dava strateji panosunu getir",
    description: "Use this when kullanıcı bir davanın belgelerini, çelişkilerini, araştırma konularını ve stratejisini görmek istiyor.",
    inputSchema: { caseId: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ caseId }) => {
    const item = await getCaseRecord(ownerId, caseId);
    const docs = await getCaseDocuments(ownerId, caseId);
    if (!item || !docs) return response({ error: "not_found" }, "Dava bulunamadı");
    return response({
      case: item,
      documentCount: docs.length,
      recentDocuments: docs.slice(-10).map(({ content, ...rest }) => rest),
      contradictions: docs.flatMap((d) => d.assessment?.contradictions ?? []),
      researchTriggers: docs.flatMap((d) => d.assessment?.researchTriggers ?? []),
      actionItems: [...new Set(docs.flatMap((d) => d.assessment?.actionItems ?? []))],
    });
  });

  server.registerTool("search", {
    title: "Özel dava arşivinde ara",
    description: "Use this when kullanıcı esas numarası, parsel, kişi, kurum, kavram veya belge cümlesiyle kendi arşivinde arama yapmak istiyor.",
    inputSchema: { query: z.string().min(2), caseId: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ query, caseId }) => response({ results: await searchRecords(ownerId, query, caseId) }));

  server.registerTool("fetch", {
    title: "Dava veya belge kaydını getir",
    description: "Use this when kullanıcı arama sonucundaki dava ya da belge kimliğiyle ayrıntılı kaydı almak istiyor.",
    inputSchema: { id: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ id }) => {
    const item = (await getCaseRecord(ownerId, id)) ?? (await getDocumentRecord(ownerId, id));
    return item ? response({ record: item }) : response({ error: "not_found", id }, "Kayıt bulunamadı");
  });

  server.registerTool("prepare_draft_outline", {
    title: "Dilekçe veya beyan iskeleti hazırla",
    description: "Use this when kullanıcı mevcut dava hafızasına dayanarak kaynak bağlı bir taslak iskeleti istiyor.",
    inputSchema: { caseId: z.string().min(1), draftType: z.string().default("genel"), objective: z.string().optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ caseId, draftType, objective }) => {
    const item = await getCaseRecord(ownerId, caseId);
    const docs = await getCaseDocuments(ownerId, caseId);
    if (!item || !docs) return response({ error: "not_found" }, "Dava bulunamadı");
    const outline = {
      draftType,
      objective: objective ?? item.objective,
      sections: [
        { title: "Dosya ve usul özeti", sources: docs.slice(0, 8).map((d) => d.id) },
        { title: "Tartışmalı maddi vakıalar", items: docs.flatMap((d) => d.assessment?.contradictions ?? []).map((x) => x.topic) },
        { title: "Lehe hususlar", items: docs.flatMap((d) => d.assessment?.favorableFindings ?? []).map((x) => x.finding) },
        { title: "Aleyhe hususlar ve cevaplar", items: docs.flatMap((d) => d.assessment?.adverseFindings ?? []).map((x) => x.finding) },
        { title: "Hukuki değerlendirme", items: [...new Set(docs.flatMap((d) => d.assessment?.researchTriggers ?? []).map((x) => x.issue))] },
        { title: "Sonuç ve talep", items: ["İnsan onayı sonrası nihai hale getir"] },
      ],
    };
    return response({ outline });
  });

  return server;
}

export async function handleMcpRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id, authorization, x-api-key",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }
  try {
    const user = resolveMcpUser(req);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
    const server = createMcpServer(user.id);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP error", error);
    if (!res.headersSent) res.writeHead(error.status ?? 500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: error.message ?? "MCP error" }));
  }
}

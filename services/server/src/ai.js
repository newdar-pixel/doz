import OpenAI from "openai";

function extractJson(text) {
  const cleaned = String(text ?? "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
}

export async function analyzeWithAI({ caseRecord, content, documentType, ruleAssessment }) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Sen Türk hukuku dosyalarında çalışan, kaynak uydurmayan bir dava analiz motorusun.
Somut belgeyi sadece verilen dava bilgileri ve belge metni üzerinden analiz et. Kesin olmayan şeyi kesin yazma. İçtihat künyesi uydurma.

DAVA:
${JSON.stringify({ title: caseRecord.title, caseType: caseRecord.caseType, court: caseRecord.court, fileNumber: caseRecord.fileNumber, clientSide: caseRecord.clientSide, objective: caseRecord.objective, learningPack: caseRecord.learningPack }, null, 2)}

BELGE TÜRÜ: ${documentType}
KURAL TABANLI ÖN ANALİZ:
${JSON.stringify(ruleAssessment, null, 2)}

BELGE METNİ:
${content.slice(0, 120000)}

Sadece geçerli JSON üret. Şema:
{
  "summary": "belgenin kısa özeti",
  "documentRole": "iddia|savunma|delil|mahkeme kararı|bilirkişi görüşü|kurum yazısı|diğer",
  "favorableFindings": [{"finding":"...","basis":"belgedeki kısa dayanak","confidence":"low|medium|high"}],
  "adverseFindings": [{"finding":"...","basis":"...","confidence":"low|medium|high"}],
  "contradictions": [{"topic":"...","newStatement":"...","priorStatement":"bilinmiyorsa boş","confidence":"low|medium|high"}],
  "deadlines": [{"date":"YYYY-MM-DD veya boş","description":"...","needsVerification":true}],
  "researchTriggers": [{"issue":"...","query":"...","reason":"...","status":"recommended"}],
  "strategyChanges": ["..."],
  "missingEvidence": ["..."],
  "warnings": ["..."]
}`;
  const response = await client.responses.create({ model: process.env.OPENAI_MODEL ?? "gpt-5.6", input: prompt });
  return extractJson(response.output_text);
}

export function mergeAssessments(ruleAssessment, aiAssessment) {
  if (!aiAssessment) return ruleAssessment;
  const uniq = (items) => [...new Set((items ?? []).filter(Boolean))];
  return {
    ...ruleAssessment,
    summary: aiAssessment.summary ?? ruleAssessment.summary,
    documentRole: aiAssessment.documentRole ?? ruleAssessment.documentRole,
    favorableFindings: aiAssessment.favorableFindings ?? [],
    adverseFindings: aiAssessment.adverseFindings ?? [],
    contradictions: [...(ruleAssessment.contradictions ?? []), ...(aiAssessment.contradictions ?? [])].slice(0, 40),
    deadlines: aiAssessment.deadlines ?? [],
    researchTriggers: [...(ruleAssessment.researchTriggers ?? []), ...(aiAssessment.researchTriggers ?? [])].slice(0, 30),
    actionItems: uniq([...(ruleAssessment.actionItems ?? []), ...(aiAssessment.strategyChanges ?? []), ...(aiAssessment.missingEvidence ?? []).map((x) => `Eksik delil: ${x}`)]),
    warnings: aiAssessment.warnings ?? [],
    aiEnhanced: true,
  };
}

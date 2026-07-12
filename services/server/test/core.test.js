import test from "node:test";
import assert from "node:assert/strict";
import { buildLearningPack } from "../src/learning.js";
import { buildDocumentAssessment } from "../src/analyzer.js";

test("kamulaştırma öğrenme paketi oluşturur", () => {
  const pack = buildLearningPack("Kamulaştırma bedelinin tespiti");
  assert.equal(pack.profileKey, "kamulastirma");
  assert.ok(pack.commonErrors.some((x) => x.includes("Tarla kirası")));
});

test("bilirkişi raporu araştırma ve işlem tetikler", () => {
  const result = buildDocumentAssessment({
    documentType: "Bilirkişi raporu",
    content: "Bilirkişi raporunda taşınmaz kuru tarım arazisi kabul edilmiş ve tarla kirası üretim giderine eklenmiştir.",
    priorDocuments: [],
  });
  assert.ok(result.researchTriggers.length >= 2);
  assert.ok(result.actionItems.some((x) => x.includes("itiraz süresi")));
});

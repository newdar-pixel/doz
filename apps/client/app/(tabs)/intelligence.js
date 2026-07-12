import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import { Card, Empty, ErrorBox, Header, Loading, Page, Pill, SectionTitle } from "../../src/components";
import { colors } from "../../src/theme";

const moduleDefinitions = [
  ["timeline", "◷", "Olay Kronolojisi", "Belge tarihlerini ve dosya hareketlerini tek çizelgede birleştirir.", "coral"],
  ["contradictions", "⌁", "Çelişki Haritası", "Belgeler arasındaki olası uyuşmazlıkları önceliklendirir.", "purple"],
  ["evidence", "▦", "Delil Matrisi", "Dosyada işlenen belgeleri ve metin kapsamını gösterir.", "sage"],
  ["deadlines", "◉", "Süre Radarı", "Kontrol edilmesi gereken süre ve tarihleri toplar.", "coral"],
  ["health", "◇", "Dosya Sağlık Puanı", "Belge, açık görev ve çelişki verisinden görünüm üretir.", "sage"],
  ["strategy", "⑂", "Strateji Dalları", "Dosyaların yaşayan strateji adımlarını listeler.", "purple"],
  ["research", "◎", "Araştırma Konuları", "Belgeden çıkan içtihat ve mevzuat araştırma başlıklarını toplar.", "coral"],
  ["events", "✓", "Karar Günlüğü", "Dosyada kaydedilen işlem hareketlerini gösterir.", "sage"],
];

const formatDate = (value) => value ? new Date(value).toLocaleDateString("tr-TR") : "Tarih belirtilmemiş";

export default function Intelligence() {
  const { width } = useWindowDimensions();
  const [dashboards, setDashboards] = useState(null); const [error, setError] = useState(""); const [active, setActive] = useState(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const { cases } = await api.listCases();
      const results = await Promise.all(cases.map(async (item) => (await api.getDashboard(item.id))));
      setDashboards(results);
    } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const all = useMemo(() => {
    const source = dashboards ?? [];
    return {
      documents: source.flatMap((d) => d.documents.map((x) => ({ ...x, caseTitle: d.case.title }))),
      contradictions: source.flatMap((d) => d.contradictions.map((x) => ({ ...x, caseTitle: d.case.title }))),
      deadlines: source.flatMap((d) => d.deadlines.map((x) => ({ ...x, caseTitle: d.case.title }))),
      research: source.flatMap((d) => d.researchTriggers.map((x) => ({ ...x, caseTitle: d.case.title }))),
      events: source.flatMap((d) => d.events.map((x) => ({ ...x, caseTitle: d.case.title }))),
    };
  }, [dashboards]);
  const score = Math.max(0, Math.min(100, 100 - (all.contradictions.length * 8) - (all.deadlines.length * 4) + Math.min(all.documents.length * 3, 18)));
  const moduleStatus = (key) => ({ timeline: `${all.documents.length} belge`, contradictions: `${all.contradictions.length} sinyal`, evidence: `${all.documents.length} kayıt`, deadlines: `${all.deadlines.length} süre`, health: `${score} / 100`, strategy: `${(dashboards ?? []).reduce((n, x) => n + (x.case.strategy?.length ?? 0), 0)} adım`, research: `${all.research.length} konu`, events: `${all.events.length} hareket` })[key];
  if (!dashboards && !error) return <Page><Loading /></Page>;
  const selected = moduleDefinitions.find(([key]) => key === active);
  return <Page><Header eyebrow="DOZ KARAR ZEKÂSI" title="Analiz Merkezi" subtitle="Yüklediğiniz dava ve belge verilerinden oluşturulan çalışma görünümü." />{error ? <ErrorBox message={error} /> : null}<View style={styles.score}><View><Text style={styles.scoreKicker}>PORTFÖY SAĞLIĞI</Text><Text style={styles.scoreTitle}>{dashboards?.length ? "Dosyalarınızın canlı görünümü hazır." : "Analiz için bir dava oluşturun."}</Text><Text style={styles.scoreText}>Bu ekran yalnızca hesabınızdaki dava, belge ve analiz kayıtlarını kullanır.</Text></View><View style={styles.scoreRing}><Text style={styles.scoreValue}>{dashboards?.length ? score : "—"}</Text><Text style={styles.scoreUnit}>/ 100</Text></View></View>{selected ? <AnalysisPanel title={selected[2]} data={all} dashboards={dashboards ?? []} kind={selected[0]} close={() => setActive(null)} /> : null}<View style={styles.grid}>{moduleDefinitions.map(([key, icon, title, text, tone]) => <Pressable key={key} onPress={() => setActive(key)} style={[styles.module, width > 1050 && { width: "48.8%" }]}><View style={[styles.icon, styles[tone]]}><Text style={styles.iconText}>{icon}</Text></View><View style={{ flex: 1 }}><View style={styles.moduleHead}><Text style={styles.title}>{title}</Text><Pill tone={tone === "sage" ? "success" : tone === "coral" ? "gold" : "blue"}>{moduleStatus(key)}</Pill></View><Text style={styles.text}>{text}</Text><Text style={styles.open}>Modülü aç →</Text></View></Pressable>)}</View></Page>;
}

function AnalysisPanel({ title, data, dashboards, kind, close }) {
  let items = [];
  if (kind === "timeline") items = data.documents.map((x) => `${formatDate(x.documentDate || x.createdAt)} · ${x.caseTitle}: ${x.title}`);
  if (kind === "contradictions") items = data.contradictions.map((x) => `${x.caseTitle}: ${x.topic} — ${x.newStatement}`);
  if (kind === "evidence") items = data.documents.map((x) => `${x.caseTitle}: ${x.title} (${x.textLength ?? 0} karakter)`);
  if (kind === "deadlines") items = data.deadlines.map((x) => `${x.caseTitle}: ${x.date || "Tarih doğrulanmalı"} — ${x.description}`);
  if (kind === "strategy") items = dashboards.flatMap((x) => (x.case.strategy ?? []).map((step) => `${x.case.title}: ${step}`));
  if (kind === "research") items = data.research.map((x) => `${x.caseTitle}: ${x.issue}`);
  if (kind === "events") items = data.events.map((x) => `${formatDate(x.at)} · ${x.caseTitle}: ${x.type}`);
  if (kind === "health") items = dashboards.map((x) => `${x.case.title}: ${x.documentCount} belge, ${x.actionItems.length} açık işlem, ${x.contradictions.length} çelişki sinyali`);
  return <Card tone="gold" style={styles.panel}><View style={styles.panelHead}><SectionTitle>{title}</SectionTitle><Pressable onPress={close}><Text style={styles.close}>Kapat ×</Text></Pressable></View>{items.length ? items.slice(0, 20).map((item, index) => <Text key={`${item}-${index}`} style={styles.item}>• {item}</Text>) : <Empty title="Henüz veri yok" text="Dava oluşturup belge yüklediğinizde bu modül otomatik olarak dolacaktır." />}</Card>;
}

const styles = StyleSheet.create({ score: { backgroundColor: colors.navy, borderRadius: 26, padding: 28, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }, scoreKicker: { color: colors.gold, fontSize: 10, letterSpacing: 1.8, fontWeight: "900" }, scoreTitle: { color: "white", fontSize: 25, fontWeight: "900", marginTop: 9 }, scoreText: { color: "#D0C2D3", lineHeight: 21, marginTop: 7, maxWidth: 650 }, scoreRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 7, borderColor: colors.gold, alignItems: "center", justifyContent: "center" }, scoreValue: { color: "white", fontSize: 28, fontWeight: "900" }, scoreUnit: { color: "#C9BACD", fontSize: 10 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, module: { width: "100%", backgroundColor: "white", borderRadius: 21, borderWidth: 1, borderColor: colors.line, padding: 20, flexDirection: "row", gap: 16 }, icon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" }, coral: { backgroundColor: colors.goldSoft }, purple: { backgroundColor: colors.blueSoft }, sage: { backgroundColor: colors.greenSoft }, iconText: { color: colors.navy, fontSize: 22, fontWeight: "900" }, moduleHead: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }, title: { color: colors.ink, fontSize: 17, fontWeight: "900" }, text: { color: colors.muted, lineHeight: 20, marginTop: 8 }, open: { color: colors.gold, fontSize: 12, fontWeight: "850", marginTop: 14 }, panel: { marginTop: 14, marginBottom: 14 }, panelHead: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }, close: { color: colors.navy, fontWeight: "850" }, item: { color: colors.ink, lineHeight: 22, marginTop: 7 } });

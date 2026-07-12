import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import { Card, Empty, Header, Loading, Page, Pill } from "../../src/components";
import { colors } from "../../src/theme";

export default function Alerts() {
  const [rows, setRows] = useState(null);
  useFocusEffect(useCallback(() => { api.listCases().then(async ({ cases }) => { const all = await Promise.all(cases.map((c) => api.getDashboard(c.id).catch(() => null))); setRows(all.filter(Boolean)); }); }, []));
  if (!rows) return <Page><Loading /></Page>;
  const actions = rows.flatMap((d) => (d.actionItems || []).map((text) => ({ caseTitle: d.case.title, text })));
  return <Page><Header eyebrow="Kontrol listesi" title="Yapılacak işler" subtitle="Belgelerden çıkarılan işlem önerileri. Süreler üretim sürümünde takvim ve bildirimle bağlanacak." />{!actions.length ? <Empty title="Açık işlem yok" text="Yeni belge yüklendikçe süre, eksik delil ve araştırma işleri burada görünür." /> : <View style={{ gap: 10 }}>{actions.map((x, i) => <Card key={`${x.caseTitle}-${i}`}><View style={styles.row}><Pill tone="gold">{i + 1}</Pill><View style={{ flex: 1 }}><Text style={styles.caseName}>{x.caseTitle}</Text><Text style={styles.text}>{x.text}</Text></View></View></Card>)}</View>}</Page>;
}
const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, caseName: { color: colors.muted, fontSize: 12, fontWeight: "750" }, text: { color: colors.ink, lineHeight: 21, fontWeight: "650", marginTop: 3 } });

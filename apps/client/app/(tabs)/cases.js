import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import { Button, Empty, ErrorBox, Header, Loading, Page, Pill } from "../../src/components";
import { colors } from "../../src/theme";

export default function Cases() {
  const [items, setItems] = useState(null); const [error, setError] = useState("");
  useFocusEffect(useCallback(() => { api.listCases().then((x) => setItems(x.cases)).catch((e) => setError(e.message)); }, []));
  if (!items && !error) return <Page><Loading /></Page>;
  return <Page><Header eyebrow="Arşiv" title="Dava dosyaları" subtitle="Her dosyanın kendi öğrenme paketi, belgeleri ve yaşayan stratejisi bulunur." action={<Button title="+ Yeni" onPress={() => router.push("/cases/new")} />} />{error ? <ErrorBox message={error} /> : null}{!items?.length ? <Empty title="Dava bulunamadı" text="Yeni dava oluşturarak öğrenme modunu başlat." /> : <View style={{ gap: 12 }}>{items.map((item) => <Pressable key={item.id} onPress={() => router.push(`/cases/${item.id}`)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{[item.court, item.fileNumber, item.caseType].filter(Boolean).join(" · ")}</Text><Text style={styles.goal} numberOfLines={2}>{item.objective || "Hedef henüz belirtilmedi"}</Text></View><View style={styles.side}><Pill tone="success">{item.status}</Pill><Text style={styles.count}>{item.documentIds?.length ?? 0} belge</Text></View></Pressable>)}</View>}</Page>;
}
const styles = StyleSheet.create({ row: { backgroundColor: "white", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, flexDirection: "row", gap: 14 }, title: { color: colors.ink, fontWeight: "900", fontSize: 17 }, meta: { color: colors.muted, marginTop: 5 }, goal: { color: colors.navy, marginTop: 10, lineHeight: 19 }, side: { alignItems: "flex-end", justifyContent: "space-between" }, count: { color: colors.muted, fontWeight: "700", fontSize: 12 } });

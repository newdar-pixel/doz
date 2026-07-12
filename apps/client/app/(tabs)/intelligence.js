import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Header, Page, Pill } from "../../src/components";
import { colors } from "../../src/theme";

const modules = [
  ["◷", "Olay Kronolojisi", "Belgelerdeki tarih ve olayları doğrulanabilir bir zaman çizelgesinde birleştirir.", "12 olay", "coral"],
  ["⌁", "Çelişki Haritası", "Beyanlar, raporlar ve deliller arasındaki uyuşmazlıkları ilişkilendirir.", "3 sinyal", "purple"],
  ["▦", "Delil Matrisi", "Her iddianın hangi delille ve ne ölçüde desteklendiğini gösterir.", "%78 bağlı", "sage"],
  ["◉", "Süre Radarı", "Yaklaşan süreleri önem ve gecikme riskine göre önceliklendirir.", "3 yaklaşan", "coral"],
  ["◇", "Dosya Sağlık Puanı", "Eksik delil, açık görev ve kapsamdan genel sağlık puanı üretir.", "82 / 100", "sage"],
  ["⑂", "Strateji Dalları", "Alternatif hamleleri, sonuçları ve riskleri senaryolar halinde karşılaştırır.", "4 senaryo", "purple"],
  ["◎", "Karşı Taraf Profili", "İddia örüntülerini, tutarsızlıkları ve savunma boşluklarını toplar.", "Güncel", "coral"],
  ["✓", "Karar Günlüğü", "Stratejik kararların kim tarafından, hangi gerekçeyle alındığını kaydeder.", "8 karar", "sage"],
];

export default function Intelligence() {
  const { width } = useWindowDimensions();
  return <Page><Header eyebrow="DOZ KARAR ZEKÂSI" title="Analiz Merkezi" subtitle="Dosyanın görünmeyen bağlantılarını ortaya çıkaran sekiz güçlü çalışma modülü." /><View style={styles.score}><View><Text style={styles.scoreKicker}>PORTFÖY SAĞLIĞI</Text><Text style={styles.scoreTitle}>Dosyalarınızın genel görünümü güçlü.</Text><Text style={styles.scoreText}>DOZ, 24 veri noktasını sürekli izliyor ve kritik değişiklikleri önceliklendiriyor.</Text></View><View style={styles.scoreRing}><Text style={styles.scoreValue}>82</Text><Text style={styles.scoreUnit}>/ 100</Text></View></View><View style={styles.grid}>{modules.map(([icon, title, text, status, tone]) => <Pressable key={title} style={[styles.module, width > 1050 && { width: "48.8%" }]}><View style={[styles.icon, styles[tone]]}><Text style={styles.iconText}>{icon}</Text></View><View style={{ flex: 1 }}><View style={styles.moduleHead}><Text style={styles.title}>{title}</Text><Pill tone={tone === "sage" ? "success" : tone === "coral" ? "gold" : "blue"}>{status}</Pill></View><Text style={styles.text}>{text}</Text><Text style={styles.open}>Modülü aç  →</Text></View></Pressable>)}</View></Page>;
}

const styles = StyleSheet.create({ score: { backgroundColor: colors.navy, borderRadius: 26, padding: 28, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }, scoreKicker: { color: colors.gold, fontSize: 10, letterSpacing: 1.8, fontWeight: "900" }, scoreTitle: { color: "white", fontSize: 25, fontWeight: "900", marginTop: 9 }, scoreText: { color: "#D0C2D3", lineHeight: 21, marginTop: 7, maxWidth: 650 }, scoreRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 7, borderColor: colors.gold, alignItems: "center", justifyContent: "center" }, scoreValue: { color: "white", fontSize: 28, fontWeight: "900" }, scoreUnit: { color: "#C9BACD", fontSize: 10 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, module: { width: "100%", backgroundColor: "white", borderRadius: 21, borderWidth: 1, borderColor: colors.line, padding: 20, flexDirection: "row", gap: 16 }, icon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" }, coral: { backgroundColor: colors.goldSoft }, purple: { backgroundColor: colors.blueSoft }, sage: { backgroundColor: colors.greenSoft }, iconText: { color: colors.navy, fontSize: 22, fontWeight: "900" }, moduleHead: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }, title: { color: colors.ink, fontSize: 17, fontWeight: "900" }, text: { color: colors.muted, lineHeight: 20, marginTop: 8 }, open: { color: colors.gold, fontSize: 12, fontWeight: "850", marginTop: 14 } });

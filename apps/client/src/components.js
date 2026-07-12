import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow } from "./theme";

export function Page({ children, scroll = true, style }) {
  const body = <View style={[styles.pageInner, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView> : body}</SafeAreaView>;
}

export function Header({ eyebrow, title, subtitle, action }) {
  return <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{action}</View>;
}

export function Card({ children, style, tone = "default" }) {
  const toneStyle = tone === "gold" ? styles.cardGold : tone === "danger" ? styles.cardDanger : tone === "success" ? styles.cardSuccess : null;
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function SectionTitle({ children, right }) {
  return <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{children}</Text>{right}</View>;
}

export function Pill({ children, tone = "neutral" }) {
  const map = { neutral: styles.pillNeutral, success: styles.pillSuccess, danger: styles.pillDanger, gold: styles.pillGold, blue: styles.pillBlue };
  return <View style={[styles.pill, map[tone]]}><Text style={styles.pillText}>{children}</Text></View>;
}

export function Metric({ value, label, tone = "default" }) {
  return <Card style={styles.metric} tone={tone}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Card>;
}

export function Button({ title, onPress, variant = "primary", disabled, style }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, variant === "secondary" && styles.buttonSecondary, variant === "ghost" && styles.buttonGhost, pressed && { opacity: .82 }, disabled && { opacity: .45 }, style]}><Text style={[styles.buttonText, variant !== "primary" && styles.buttonTextDark]}>{title}</Text></Pressable>;
}

export function Field({ label, multiline, ...props }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor="#89939C" multiline={multiline} style={[styles.input, multiline && styles.textarea]} {...props} /></View>;
}

export function Empty({ title, text }) { return <Card style={{ alignItems: "center", paddingVertical: 34 }}><Text style={styles.emptyIcon}>⚖</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text></Card>; }
export function Loading() { return <View style={styles.loading}><ActivityIndicator size="large" color={colors.navy} /><Text style={styles.subtitle}>Yükleniyor…</Text></View>; }
export function ErrorBox({ message }) { return <Card tone="danger"><Text style={styles.errorText}>{message}</Text></Card>; }

export function BrandMark({ size = 48, dark = false }) {
  const scale = size / 48;
  return <View accessibilityLabel="DOZ adalet amblemi" style={[styles.brandMark, { width: size, height: size, borderRadius: 15 * scale }, dark && styles.brandMarkDark]}>
    <View style={[styles.head, { width: 10 * scale, height: 10 * scale, borderRadius: 5 * scale, top: 7 * scale }]} />
    <View style={[styles.blindfold, { width: 18 * scale, height: 3 * scale, top: 11 * scale }]} />
    <View style={[styles.scaleStem, { width: 2 * scale, height: 23 * scale, top: 16 * scale }]} />
    <View style={[styles.scaleBeam, { width: 29 * scale, height: 2 * scale, top: 20 * scale }]} />
    <View style={[styles.leftChain, { left: 10 * scale, top: 21 * scale, height: 8 * scale }]} />
    <View style={[styles.rightChain, { right: 10 * scale, top: 21 * scale, height: 8 * scale }]} />
    <View style={[styles.pan, { left: 5 * scale, top: 29 * scale, width: 13 * scale, height: 5 * scale, borderBottomLeftRadius: 9 * scale, borderBottomRightRadius: 9 * scale }]} />
    <View style={[styles.pan, { right: 5 * scale, top: 29 * scale, width: 13 * scale, height: 5 * scale, borderBottomLeftRadius: 9 * scale, borderBottomRightRadius: 9 * scale }]} />
    <View style={[styles.base, { width: 18 * scale, height: 3 * scale, bottom: 6 * scale, borderRadius: 2 * scale }]} />
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, scroll: { flexGrow: 1 }, pageInner: { width: "100%", maxWidth: 1220, alignSelf: "center", padding: 22, gap: 18 },
  header: { flexDirection: "row", gap: 16, alignItems: "flex-start", paddingTop: 6, paddingBottom: 4 }, eyebrow: { color: colors.gold, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }, title: { fontSize: 30, lineHeight: 36, fontWeight: "900", color: colors.ink, marginTop: 5 }, subtitle: { color: colors.muted, marginTop: 7, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 18, ...shadow }, cardGold: { backgroundColor: colors.goldSoft, borderColor: "#E4CEA5" }, cardDanger: { backgroundColor: colors.redSoft, borderColor: "#E5BABA" }, cardSuccess: { backgroundColor: colors.greenSoft, borderColor: "#B8D8CC" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "850" },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: "flex-start" }, pillNeutral: { backgroundColor: "#E7EAEC" }, pillSuccess: { backgroundColor: colors.greenSoft }, pillDanger: { backgroundColor: colors.redSoft }, pillGold: { backgroundColor: colors.goldSoft }, pillBlue: { backgroundColor: colors.blueSoft }, pillText: { color: colors.ink, fontSize: 12, fontWeight: "750" },
  metric: { minWidth: 165, flexGrow: 1, padding: 20 }, metricValue: { fontSize: 30, fontWeight: "900", color: colors.navy }, metricLabel: { color: colors.muted, marginTop: 6, fontWeight: "650" },
  button: { backgroundColor: colors.navy, minHeight: 50, borderRadius: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", ...shadow }, buttonSecondary: { backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: "#D5B77C", shadowOpacity: 0 }, buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line, shadowOpacity: 0 }, buttonText: { color: "white", fontWeight: "850", fontSize: 15 }, buttonTextDark: { color: colors.ink },
  field: { gap: 8 }, fieldLabel: { color: colors.ink, fontWeight: "750", fontSize: 13 }, input: { backgroundColor: "#FAFAF8", borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 52, paddingHorizontal: 15, color: colors.ink, fontSize: 15 }, textarea: { minHeight: 120, paddingTop: 13, textAlignVertical: "top" },
  emptyIcon: { fontSize: 34, color: colors.gold, fontWeight: "900" }, emptyTitle: { fontSize: 18, fontWeight: "850", color: colors.ink, marginTop: 8 }, emptyText: { color: colors.muted, textAlign: "center", marginTop: 6, maxWidth: 480, lineHeight: 21 }, loading: { minHeight: 300, alignItems: "center", justifyContent: "center", gap: 12 }, errorText: { color: colors.red, fontWeight: "700" },
  brandMark: { backgroundColor: colors.gold, alignItems: "center", position: "relative", overflow: "hidden" }, brandMarkDark: { backgroundColor: colors.navy }, head: { position: "absolute", backgroundColor: "white" }, blindfold: { position: "absolute", backgroundColor: colors.navy, borderRadius: 2, zIndex: 2 }, scaleStem: { position: "absolute", backgroundColor: "white" }, scaleBeam: { position: "absolute", backgroundColor: "white" }, leftChain: { position: "absolute", width: 1, backgroundColor: "white" }, rightChain: { position: "absolute", width: 1, backgroundColor: "white" }, pan: { position: "absolute", backgroundColor: "white" }, base: { position: "absolute", backgroundColor: "white" },
});

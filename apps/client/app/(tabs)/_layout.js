import React from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "../../src/theme";
import { BrandMark } from "../../src/components";

const icons = { index: "◈", cases: "⚖", intelligence: "✦", alerts: "✓", settings: "⌘" };
const labels = { index: "Genel Bakış", cases: "Dava Portföyü", intelligence: "Analiz Merkezi", alerts: "Görev Merkezi", settings: "Sistem" };
const mobileLabels = { index: "Pano", cases: "Davalar", intelligence: "Analiz", alerts: "İşler", settings: "Ayarlar" };

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const desktop = width >= 860;
  return <Tabs tabBar={(props) => <PremiumNav {...props} desktop={desktop} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg, marginLeft: desktop ? 252 : 0, paddingBottom: desktop ? 0 : 74 } }}>
    <Tabs.Screen name="index" options={{ title: "Pano" }} />
    <Tabs.Screen name="cases" options={{ title: "Davalar" }} />
    <Tabs.Screen name="intelligence" options={{ title: "Analiz" }} />
    <Tabs.Screen name="alerts" options={{ title: "İşler" }} />
    <Tabs.Screen name="settings" options={{ title: "Ayarlar" }} />
  </Tabs>;
}

function PremiumNav({ state, navigation, desktop }) {
  return <View style={desktop ? styles.rail : styles.bottom}>
    {desktop ? <><View style={styles.brand}><BrandMark size={44} /><View><Text style={styles.brandName}>DOZ</Text><Text style={styles.brandMeta}>KARAR ZEKÂSI</Text></View></View><Text style={styles.group}>ÇALIŞMA ALANI</Text></> : null}
    <View style={desktop ? styles.links : styles.bottomLinks}>{state.routes.map((route, index) => { const active = state.index === index; return <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={[styles.navItem, !desktop && styles.navItemBottom, active && styles.navActive]}><Text style={[styles.navIcon, active && styles.navIconActive]}>{icons[route.name]}</Text><Text style={[styles.navLabel, active && styles.navLabelActive]}>{desktop ? labels[route.name] : mobileLabels[route.name]}</Text>{active && desktop ? <View style={styles.activeBar} /> : null}</Pressable>; })}</View>
    {desktop ? <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>AK</Text></View><View style={{ flex: 1 }}><Text style={styles.profileName}>Av. Kullanıcı</Text><Text style={styles.profileRole}>Yönetici hesap</Text></View><Text style={styles.more}>•••</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({ rail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 252, backgroundColor: colors.navy, padding: 24, zIndex: 10 }, brand: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 42 }, monogram: { width: 44, height: 44, backgroundColor: colors.gold, borderRadius: 14, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }] }, monogramText: { color: "white", fontSize: 14, fontWeight: "900", transform: [{ rotate: "4deg" }] }, brandName: { color: "white", letterSpacing: 4, fontWeight: "900", fontSize: 18 }, brandMeta: { color: "#A792AC", fontSize: 8, letterSpacing: 1.2, marginTop: 3 }, group: { color: "#A792AC", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }, links: { gap: 8 }, navItem: { minHeight: 50, borderRadius: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 13, position: "relative" }, navActive: { backgroundColor: "#4B3454" }, navIcon: { color: "#A792AC", fontSize: 19, width: 23, textAlign: "center", fontWeight: "900" }, navIconActive: { color: "#F09A82" }, navLabel: { color: "#BCAFC0", fontWeight: "700", fontSize: 13 }, navLabelActive: { color: "white" }, activeBar: { position: "absolute", right: -24, width: 3, height: 26, backgroundColor: colors.gold }, profile: { marginTop: "auto", borderTopWidth: 1, borderTopColor: "#59415F", paddingTop: 20, flexDirection: "row", alignItems: "center", gap: 10 }, avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#E7D7DB", alignItems: "center", justifyContent: "center" }, avatarText: { color: colors.navy, fontWeight: "900", fontSize: 12 }, profileName: { color: "white", fontSize: 12, fontWeight: "800" }, profileRole: { color: "#A792AC", fontSize: 10, marginTop: 2 }, more: { color: "#A792AC" }, bottom: { position: "absolute", left: 10, right: 10, bottom: 8, height: 68, backgroundColor: colors.navy, borderRadius: 20, zIndex: 10, paddingHorizontal: 4 }, bottomLinks: { flexDirection: "row", flex: 1 }, navItemBottom: { flex: 1, flexDirection: "column", gap: 1, justifyContent: "center", paddingHorizontal: 1 } });

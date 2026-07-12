import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { API_URL, api } from "../../src/api";
import { Button, Card, Header, Page, Pill } from "../../src/components";
import { getSession, signOut } from "../../src/session";
import { colors } from "../../src/theme";

export default function Settings() {
  const [session, setSession] = useState(null); const [health, setHealth] = useState(null);
  useEffect(() => { getSession().then(setSession); api.health().then(setHealth).catch(() => setHealth({ ok: false })); }, []);
  async function logout() { await signOut(); router.replace("/login"); }
  return <Page><Header eyebrow="Sistem" title="Ayarlar" subtitle="Bağlantı ve çalışma modu bilgileri." /><Card><Text style={styles.label}>Oturum</Text><Text style={styles.value}>{session?.user?.email || "Demo kullanıcı"}</Text></Card><Card><Text style={styles.label}>API adresi</Text><Text style={styles.value}>{API_URL}</Text><Pill tone={health?.ok ? "success" : "danger"}>{health?.ok ? "Bağlı" : "Bağlantı yok"}</Pill></Card><Card tone="gold"><Text style={styles.label}>AI analizi</Text><Text style={styles.value}>{health?.aiEnabled ? "Etkin" : "Kapalı — kural tabanlı analiz çalışıyor"}</Text></Card><Button title="Oturumu kapat" variant="ghost" onPress={logout} /></Page>;
}
const styles = StyleSheet.create({ label: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: .8 }, value: { color: colors.ink, fontSize: 16, fontWeight: "750", marginVertical: 9 } });

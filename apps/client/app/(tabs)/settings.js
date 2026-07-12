import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { API_URL, api } from "../../src/api";
import { Button, Card, Field, Header, Page, Pill } from "../../src/components";
import { getSession, signOut } from "../../src/session";
import { colors } from "../../src/theme";

export default function Settings() {
  const [session, setSession] = useState(null); const [health, setHealth] = useState(null); const [ai, setAi] = useState(null); const [apiKey, setApiKey] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { getSession().then(setSession); api.health().then(setHealth).catch(() => setHealth({ ok: false })); api.getAIConnection().then(setAi).catch(() => setAi({ connected: false })); }, []);
  async function logout() { await signOut(); router.replace("/login"); }
  async function connectAI() { setMessage(""); setBusy(true); try { await api.saveAIConnection(apiKey); setApiKey(""); setAi(await api.getAIConnection()); setMessage("Kendi OpenAI hesabınız bağlandı. Yeni belgeler AI ile analiz edilecek."); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  async function disconnectAI() { setMessage(""); setBusy(true); try { await api.removeAIConnection(); setAi({ connected: false }); setMessage("AI bağlantısı kaldırıldı."); } catch (error) { setMessage(error.message); } finally { setBusy(false); } }
  return <Page><Header eyebrow="Sistem" title="Ayarlar" subtitle="Bağlantı ve çalışma modu bilgileri." /><Card><Text style={styles.label}>Oturum</Text><Text style={styles.value}>{session?.user?.email || "Demo kullanıcı"}</Text></Card><Card><Text style={styles.label}>API adresi</Text><Text style={styles.value}>{API_URL}</Text><Pill tone={health?.ok ? "success" : "danger"}>{health?.ok ? "Bağlı" : "Bağlantı yok"}</Pill></Card><Card tone="gold"><Text style={styles.label}>Kişisel AI bağlantısı</Text><Text style={styles.value}>{ai?.connected ? "OpenAI hesabınız bağlı" : "Bağlı değil — kural tabanlı analiz çalışıyor"}</Text><Text style={styles.help}>Anahtarınız şifrelenerek yalnızca sizin belge analiziniz için saklanır; ekranda tekrar gösterilmez.</Text>{ai?.connected ? <Button title={busy ? "Kaldırılıyor…" : "AI bağlantısını kaldır"} variant="ghost" onPress={disconnectAI} disabled={busy} /> : <><Field label="OpenAI API anahtarı" value={apiKey} onChangeText={setApiKey} secureTextEntry autoCapitalize="none" placeholder="sk-..." /><Button title={busy ? "Bağlanıyor…" : "Kendi OpenAI hesabımı bağla"} onPress={connectAI} disabled={busy || apiKey.trim().length < 20} /></>}</Card>{message ? <Text style={styles.message}>{message}</Text> : null}<Button title="Oturumu kapat" variant="ghost" onPress={logout} /></Page>;
}
const styles = StyleSheet.create({ label: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: .8 }, value: { color: colors.ink, fontSize: 16, fontWeight: "750", marginVertical: 9 }, help: { color: colors.muted, lineHeight: 20, fontSize: 13, marginBottom: 12 }, message: { color: colors.navy, lineHeight: 20, fontWeight: "700" } });

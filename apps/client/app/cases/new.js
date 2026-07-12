import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/api";
import { Button, Card, ErrorBox, Field, Page } from "../../src/components";

export default function NewCase() {
  const [form, setForm] = useState({ title: "", caseType: "", court: "", fileNumber: "", clientSide: "", objective: "", summary: "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const set = (key) => (value) => setForm((x) => ({ ...x, [key]: value }));
  async function submit() {
    setBusy(true); setError("");
    try {
      const result = await api.createCase(form);
      router.replace(`/cases/${result.case.id}`);
    } catch (e) { setError(e.message); Alert.alert("Dava oluşturulamadı", e.message); }
    finally { setBusy(false); }
  }
  return <Page><Card style={styles.form}>{error ? <ErrorBox message={error} /> : null}<Field label="Dosya adı *" placeholder="Örn. TKİ — 201 ada 24" value={form.title} onChangeText={set("title")} /><Field label="Dava türü *" placeholder="Kamulaştırma, VUK 359, ecrimisil..." value={form.caseType} onChangeText={set("caseType")} /><View style={styles.row}><View style={styles.flex}><Field label="Mahkeme" value={form.court} onChangeText={set("court")} /></View><View style={styles.flex}><Field label="Esas / dosya no" value={form.fileNumber} onChangeText={set("fileNumber")} /></View></View><Field label="Bizim tarafımız" placeholder="Davalı malik, sanık, davacı..." value={form.clientSide} onChangeText={set("clientSide")} /><Field label="Davanın hedefi" multiline value={form.objective} onChangeText={set("objective")} placeholder="Bu dosyada ulaşılmak istenen hukuki sonuç" /><Field label="Başlangıç özeti" multiline value={form.summary} onChangeText={set("summary")} placeholder="Dava nasıl başladı, ilk belgeler ve kritik olaylar" /><Button title={busy ? "Öğrenme modu başlatılıyor…" : "Davayı oluştur ve öğrenme modunu başlat"} onPress={submit} disabled={busy || form.title.trim().length < 3 || form.caseType.trim().length < 2} /></Card></Page>;
}
const styles = StyleSheet.create({ form: { gap: 15 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, flex: { flex: 1, minWidth: 220 } });

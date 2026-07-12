import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { BrandMark, Button, Card, Field, Page } from "../src/components";
import { resendConfirmation, signIn, signUp } from "../src/session";
import { colors } from "../src/theme";

export default function Login() {
  const { width } = useWindowDimensions();
  // Static web output is hydrated in the browser. Defer the responsive split
  // until after hydration so the server and first browser render match.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const wide = hydrated && width >= 900;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [canResend, setCanResend] = useState(false);

  // Expo's static HTML can differ from React Native Web's client markup.
  // Render a stable shell first, then mount the interactive form in-browser.
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  async function handleSignIn() {
    setMessage("");
    setCanResend(false);
    if (!email.includes("@") || password.length < 8) {
      setMessage("Giriş için geçerli bir e-posta ve en az 8 karakterlik şifre girin.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      const needsConfirmation = /email not confirmed/i.test(error.message);
      setCanResend(needsConfirmation);
      setMessage(needsConfirmation ? "E-posta adresiniz henüz doğrulanmadı. Aşağıdan yeni doğrulama bağlantısı isteyin." : `Giriş yapılamadı: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setMessage("");
    setCanResend(false);
    if (!email.includes("@") || password.length < 8) {
      setMessage("Hesap oluşturmak için e-posta adresinizi ve en az 8 karakterlik şifrenizi girin.");
      return;
    }
    setBusy(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.session) {
        router.replace("/(tabs)");
      } else {
        setCanResend(true);
        setMessage("Hesabın oluşturuldu. E-posta adresine gönderilen doğrulama bağlantısını açtıktan sonra giriş yap.");
      }
    } catch (error) {
      const mayAlreadyExist = /already registered|already exists/i.test(error.message);
      setCanResend(mayAlreadyExist);
      setMessage(mayAlreadyExist ? "Bu e-posta için doğrulanmayı bekleyen bir hesap var. Yeni doğrulama bağlantısı isteyebilirsiniz." : `Kayıt oluşturulamadı: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleResendConfirmation() {
    setMessage("");
    setBusy(true);
    try {
      await resendConfirmation(email.trim());
      setMessage("Yeni doğrulama bağlantısı e-posta adresinize gönderildi.");
    } catch (error) {
      setMessage(`Doğrulama e-postası gönderilemedi: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Page style={styles.wrap}>
      <View style={[styles.shell, wide && styles.shellWide]}>
        <View style={[styles.story, wide && styles.storyWide]}>
          <View style={styles.logoRow}><BrandMark /><View><Text style={styles.name}>DOZ</Text><Text style={styles.tag}>Dosyadan öngörüye.</Text></View></View>
          <View style={styles.storyBody}><Text style={styles.kicker}>HUKUKİ KARAR ZEKÂSI</Text><Text style={styles.hero}>Her dosyanın içindeki gerçeği görün.</Text><Text style={styles.heroCopy}>DOZ; olayları, delilleri ve çelişkileri birbirine bağlar. Dağınık dosya bilgisini savunulabilir bir stratejiye dönüştürür.</Text></View>
          <View style={styles.features}><Feature icon="01" title="Belge zekâsı" text="Çelişki, delil ve riskleri görünür kılar." /><Feature icon="02" title="Yaşayan strateji" text="Her gelişmede dosya planını günceller." /><Feature icon="03" title="İnsan onayı" text="Kritik kararların kontrolü daima sizde kalır." /></View>
          <Text style={styles.security}>● Uçtan uca güvenli çalışma alanı</Text>
        </View>
        <Card style={[styles.loginCard, wide && styles.loginCardWide]}>
        <View><Text style={styles.welcome}>Tekrar hoş geldiniz</Text><Text style={styles.copy}>Çalışma alanınıza devam etmek için hesabınıza giriş yapın.</Text></View>
        <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="En az 8 karakter" />
        <Button title={busy ? "İşleniyor…" : "Giriş yap"} onPress={handleSignIn} disabled={disabled} />
        <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>veya</Text><View style={styles.line} /></View>
        <Button title="Yeni hesap oluştur" variant="ghost" onPress={handleSignUp} disabled={disabled} />
        {message ? <Text style={styles.formMessage}>{message}</Text> : null}
        {canResend ? <Button title={busy ? "Gönderiliyor…" : "Doğrulama e-postasını yeniden gönder"} variant="secondary" onPress={handleResendConfirmation} disabled={busy || !email.includes("@")} /> : null}
        <Text style={styles.note}>Devam ederek güvenli kullanım ve veri koruma ilkelerini kabul etmiş olursunuz.</Text>
        </Card>
      </View>
    </Page>
  </KeyboardAvoidingView>;
}
function Feature({ icon, title, text }) { return <View style={styles.feature}><View style={styles.featureNo}><Text style={styles.featureNoText}>{icon}</Text></View><View style={{ flex: 1 }}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View></View>; }
const styles = StyleSheet.create({
  wrap: { maxWidth: 1180, justifyContent: "center", flex: 1, paddingVertical: 32 }, shell: { overflow: "hidden", borderRadius: 28, backgroundColor: colors.navy }, shellWide: { flexDirection: "row", minHeight: 670 },
  story: { padding: 28, gap: 30 }, storyWide: { width: "56%", padding: 46, justifyContent: "space-between" }, logoRow: { flexDirection: "row", alignItems: "center", gap: 13 }, logoBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }] }, mark: { color: "white", fontSize: 16, letterSpacing: -1, fontWeight: "900", transform: [{ rotate: "4deg" }] }, name: { color: "white", fontSize: 21, letterSpacing: 5, fontWeight: "900" }, tag: { color: "#C7B8CB", marginTop: 3, fontSize: 12 },
  storyBody: { maxWidth: 530 }, kicker: { color: "#E5C98F", fontSize: 12, letterSpacing: 2, fontWeight: "850" }, hero: { color: "white", fontSize: 43, lineHeight: 50, fontWeight: "900", marginTop: 16, letterSpacing: -.8 }, heroCopy: { color: "#C2D0D7", fontSize: 16, lineHeight: 26, marginTop: 18, maxWidth: 490 }, features: { gap: 16 }, feature: { flexDirection: "row", gap: 13, alignItems: "center" }, featureNo: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: "#3E6072", alignItems: "center", justifyContent: "center" }, featureNoText: { color: colors.gold, fontWeight: "900", fontSize: 12 }, featureTitle: { color: "white", fontWeight: "800" }, featureText: { color: "#9FB2BD", fontSize: 13, marginTop: 3 }, security: { color: "#83B6A3", fontWeight: "700", fontSize: 12 },
  loginCard: { gap: 18, padding: 28, borderRadius: 0, borderWidth: 0, shadowOpacity: 0 }, loginCardWide: { width: "44%", paddingHorizontal: 54, justifyContent: "center" }, welcome: { color: colors.ink, fontSize: 29, lineHeight: 36, fontWeight: "900" }, copy: { color: colors.muted, lineHeight: 22, marginTop: 8 }, divider: { flexDirection: "row", alignItems: "center", gap: 10 }, line: { height: 1, backgroundColor: colors.line, flex: 1 }, or: { color: colors.muted, fontSize: 12 }, formMessage: { color: colors.navy, fontSize: 13, lineHeight: 20, textAlign: "center", fontWeight: "650" }, note: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" }
});

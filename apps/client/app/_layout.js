import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/theme";

export default function RootLayout() {
  return <SafeAreaProvider><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false, contentStyle: { backgroundColor: colors.bg } }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="cases/new" options={{ title: "Yeni dava" }} /><Stack.Screen name="cases/[id]" options={{ title: "Dava dosyası" }} /><Stack.Screen name="cases/[id]/upload" options={{ title: "Belge yükle" }} /></Stack></SafeAreaProvider>;
}

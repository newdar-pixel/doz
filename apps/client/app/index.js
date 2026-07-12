import React, { useEffect } from "react";
import { router } from "expo-router";
import { Loading, Page } from "../src/components";
import { getSession } from "../src/session";

export default function Index() {
  useEffect(() => {
    getSession().then((session) => router.replace(session ? "/(tabs)" : "/login")).catch(() => router.replace("/login"));
  }, []);
  return <Page scroll={false}><Loading /></Page>;
}

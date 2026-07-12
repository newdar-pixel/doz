import { supabase } from "./supabase";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: "https://doz-client.onrender.com" },
  });
  if (error) throw error;
  return data;
}

export async function resendConfirmation(email) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: "https://doz-client.onrender.com" },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

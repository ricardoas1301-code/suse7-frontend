// src/supabaseClient.js — client único Supabase (browser)

import { createClient } from "@supabase/supabase-js";
import {
  buildSupabaseLoginDebug,
  normalizeSupabaseUrl,
  validateSupabaseEnvPair,
} from "./lib/supabaseEnv.js";

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

const envCheck = validateSupabaseEnvPair({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
});

if (!envCheck.ok) {
  const message = `[Suse7][Supabase] ${envCheck.message}`;
  console.error(message);
  if (import.meta.env.DEV) {
    throw new Error(message);
  }
}

export const supabaseProjectRef = envCheck.ok ? envCheck.projectRef : null;
export const supabaseRealUrl = envCheck.ok ? envCheck.url : supabaseUrl;

export const supabase = createClient(envCheck.ok ? envCheck.url : supabaseUrl || "", supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Diagnóstico de login — URL real que o SDK usa */
export function getSupabaseLoginDebug() {
  const clientUrl =
    typeof supabase.supabaseUrl === "string"
      ? supabase.supabaseUrl
      : supabaseRealUrl;
  return buildSupabaseLoginDebug({
    clientUrl,
    projectRef: supabaseProjectRef,
  });
}

if (import.meta.env.DEV && envCheck.ok) {
  const debug = getSupabaseLoginDebug();
  console.info("[Suse7][Supabase] DEV", debug);
  if (debug.usesLocalhost) {
    console.error(
      "[Suse7][Supabase] ERRO: client apontando para localhost — login vai falhar. Reinicie o Vite após corrigir .env."
    );
  }
}

// src/supabaseClient.js — client único Supabase (browser)

import { createClient } from "@supabase/supabase-js";
import {
  buildSupabaseLoginDebug,
  normalizeSupabaseUrl,
  validateSupabaseEnvPair,
} from "./lib/supabaseEnv.js";
import { logIntroAuthDev } from "./auth/introAuthSession.js";

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
const supabaseStorageKey = `sb-${supabaseProjectRef ?? "default"}-auth-token`;

if (typeof window !== "undefined") {
  logIntroAuthDev("session_persistence_mode", {
    mode: "sessionStorage",
    storage_key: supabaseStorageKey,
  });
  try {
    const stalePersistentSession = window.localStorage.getItem(supabaseStorageKey);
    if (stalePersistentSession) {
      window.localStorage.removeItem(supabaseStorageKey);
      logIntroAuthDev("existing_persistent_session_cleared", {
        storage_key: supabaseStorageKey,
      });
    }
  } catch (error) {
    logIntroAuthDev("existing_persistent_session_cleared", {
      storage_key: supabaseStorageKey,
      warning: error?.message ?? "localStorage_unavailable",
    });
  }
}

export const supabase = createClient(envCheck.ok ? envCheck.url : supabaseUrl || "", supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage:
      typeof window !== "undefined" && window.sessionStorage
        ? window.sessionStorage
        : undefined,
    storageKey: supabaseStorageKey,
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

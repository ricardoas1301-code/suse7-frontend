import { supabase } from "../supabaseClient";
import { getPreferences } from "./userPreferencesService";

function maskEmail(email) {
  const value = String(email ?? "").trim();
  if (!value || !value.includes("@")) return null;
  const [name, domain] = value.split("@");
  if (!name || !domain) return null;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function normalizePreferencesByType(rawPrefs) {
  const out = {};
  for (const [key, value] of Object.entries(rawPrefs ?? {})) {
    if (!key.toLowerCase().startsWith("notify.")) continue;
    const type = key.replace(/^notify\./i, "").split(".")[0]?.toUpperCase?.() ?? "";
    if (!type) continue;
    out[type] = value;
  }
  return out;
}

export async function resolveNotificationUserContext() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Usuário não autenticado." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, whatsapp, telefone")
    .eq("id", user.id)
    .maybeSingle();

  const email = String(profile?.email || user.email || "").trim() || null;
  const whatsapp = String(profile?.whatsapp || "").trim() || null;

  const prefResult = await getPreferences("notify.");
  const preferences = prefResult.ok && prefResult.data ? prefResult.data : {};
  const preferencesByType = normalizePreferencesByType(preferences);

  const context = {
    user_id: user.id,
    email,
    whatsapp,
    whatsapp_integration_ready: false,
    preferencesByType,
    preferencesRaw: preferences,
  };

  if (import.meta.env.DEV) {
    console.info("[notificationUserResolver] contexto carregado", {
      user_id: user.id,
      email: maskEmail(email),
      whatsapp: maskPhone(whatsapp),
      preferences_count: Object.keys(preferencesByType).length,
    });
  }

  return { ok: true, data: context };
}


// =============================================================================
// API — Fale Conosco (Motor Central S5.13)
// Contrato: { success: true } | { success: false, error: string }
// =============================================================================

import { buildApiUrl } from "../config/api";

/**
 * @param {{ name: string; email: string; subject: string; message: string; source?: string; plan_key?: string }} payload
 */
export async function postFaleConoscoContact(payload) {
  const url = buildApiUrl("/api/public/fale-conosco/contact");
  if (!url) {
    return { success: false, error: "API não configurada" };
  }

  const body = {
    name: String(payload.name ?? "").trim(),
    email: String(payload.email ?? "").trim(),
    subject: String(payload.subject ?? "").trim(),
    message: String(payload.message ?? "").trim(),
  };

  const source = String(payload.source ?? "").trim();
  const planKey = String(payload.plan_key ?? "").trim();
  if (source) body.source = source;
  if (planKey) body.plan_key = planKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  try {
    return await res.json();
  } catch {
    return { success: false, error: "Erro inesperado ao enviar." };
  }
}

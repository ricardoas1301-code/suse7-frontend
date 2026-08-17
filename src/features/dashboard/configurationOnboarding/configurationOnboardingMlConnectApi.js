import { buildApiUrl, getSessionToken } from "../../../config/api.js";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida sessão Supabase antes de iniciar OAuth por navegação browser.
 */
export async function validarSessaoParaConexaoMl() {
  await ensureAuthSessionBootstrapped();
  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente.", code: "UNAUTHORIZED" };
  }
  return { ok: true };
}

/**
 * Rota SPA /ml/connect — repassa seller_company_id e intent para MLConnect.
 * @param {{ sellerCompanyId: string; intent?: string }} params
 */
export function montarUrlRotaMlConnectFrontend(params) {
  const sellerCompanyId = String(params?.sellerCompanyId ?? "").trim();
  if (!sellerCompanyId || !UUID_REGEX.test(sellerCompanyId)) {
    return null;
  }
  const qs = new URLSearchParams();
  qs.set("seller_company_id", sellerCompanyId);
  const intent = String(params?.intent ?? "").trim();
  if (intent) qs.set("intent", intent);
  return `/ml/connect?${qs.toString()}`;
}

/**
 * URL absoluta do backend /api/ml/connect — contrato homologado (navegação browser).
 * O browser segue a cadeia 302 (incl. host proxy DEV) nativamente; fetch+Location quebra.
 * @param {{ userId: string; sellerCompanyId: string; intent?: string }} params
 */
export function montarUrlBackendMlConnect(params) {
  const userId = String(params?.userId ?? "").trim();
  const sellerCompanyId = String(params?.sellerCompanyId ?? "").trim();
  if (!userId || !UUID_REGEX.test(userId)) return null;
  if (!sellerCompanyId || !UUID_REGEX.test(sellerCompanyId)) return null;

  const qs = new URLSearchParams();
  qs.set("user_id", userId);
  qs.set("seller_company_id", sellerCompanyId);
  const intent = String(params?.intent ?? "").trim();
  if (intent) qs.set("intent", intent);

  return buildApiUrl(`/api/ml/connect?${qs.toString()}`);
}

/**
 * Recovery idempotente dos latches pós-OAuth.
 */
export async function reconciliarLatchesConfiguracaoInicial() {
  const url = buildApiUrl("/api/onboarding/reconcile-latches");
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL." };

  await ensureAuthSessionBootstrapped();
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "Sessão expirada.", code: "UNAUTHORIZED" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error:
        (body && typeof body === "object" && typeof body.message === "string" ? body.message : null) ||
        (body && typeof body === "object" && typeof body.error === "string" ? body.error : null) ||
        "Não foi possível reconciliar o progresso.",
      code: body?.code ?? null,
    };
  }
  return { ok: true, data: body };
}

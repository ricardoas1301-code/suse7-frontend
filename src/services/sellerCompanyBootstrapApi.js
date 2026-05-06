// Cria a primeira seller_company via backend (schema: company_name / trade_name / document_cnpj).
// Evita insert direto no Supabase com colunas legadas (ex.: "name").

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @param {{ cnpjDigits: string; companyName: string; tradeName?: string | null }} p
 * @returns {Promise<{ ok: boolean; skipped?: boolean; reason?: string }>}
 */
export async function ensurePrimarySellerCompanyForCnpj(p) {
  const doc = String(p?.cnpjDigits || "").replace(/\D/g, "");
  if (doc.length !== 14) {
    return { ok: true, skipped: true, reason: "not_cnpj" };
  }
  const companyName = String(p?.companyName || "").trim();
  if (!companyName) {
    return { ok: true, skipped: true, reason: "missing_company_name" };
  }
  const url = buildApiUrl("/api/seller/companies");
  if (!url) {
    return { ok: true, skipped: true, reason: "no_api_base" };
  }

  const list = await apiFetch(url, { method: "GET" });
  if (list.ok && Array.isArray(list.data?.companies)) {
    const exists = list.data.companies.some((c) => {
      const d = String(c.document_cnpj ?? c.document ?? "").replace(/\D/g, "");
      return d === doc;
    });
    if (exists) {
      return { ok: true, skipped: true, reason: "already_exists" };
    }
  }

  const trade = p.tradeName != null && String(p.tradeName).trim() !== "" ? String(p.tradeName).trim() : null;
  const { ok, data, status } = await apiFetch(url, {
    method: "POST",
    body: {
      company_name: companyName,
      trade_name: trade ?? companyName,
      document_cnpj: doc,
      active: true,
    },
  });

  if (ok && data?.company?.id) {
    return { ok: true };
  }

  if (import.meta.env.DEV) {
    console.warn("[sellerCompanyBootstrapApi] POST /api/seller/companies falhou", { status, error: data?.error });
  }
  return { ok: false, status, data };
}

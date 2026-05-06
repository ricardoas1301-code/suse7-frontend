// Hidrata seller_companies via backend: GET /api/seller/companies cria a primeira empresa
// a partir de public.profiles (id, cpf_cnpj, nome_loja, nome, email) quando lista está vazia e CNPJ = 14 dígitos.
// Nunca grava coluna seller_companies.name — apenas company_name / trade_name / document_cnpj.

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * Força uma leitura da lista; o backend repara usuário existente com profile + CNPJ 14 sem seller_company.
 * @returns {Promise<{ ok: boolean; skipped?: boolean; reason?: string }>}
 */
export async function ensureSellerCompaniesHydratedFromProfile() {
  const url = buildApiUrl("/api/seller/companies");
  if (!url) {
    return { ok: true, skipped: true, reason: "no_api_base" };
  }
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok && import.meta.env.DEV) {
    console.warn("[sellerCompanyBootstrapApi] GET /api/seller/companies", res.status, res.error);
  }
  return { ok: res.ok };
}

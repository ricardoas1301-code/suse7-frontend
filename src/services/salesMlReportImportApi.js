// ======================================================
// POST /api/sales/import-ml-report — multipart (campo "file")
// Não usa apiFetch: corpo é FormData, não JSON.
// ======================================================

import { buildApiUrl, getSessionToken } from "../config/api";

/**
 * @param {File} file
 * @param {{ marketplaceAccountId?: string | null; sellerCompanyId?: string | null }} [opts]
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function postImportMlSalesReport(file, opts = {}) {
  const base = buildApiUrl("/api/sales/import-ml-report");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL para importar o relatório.", status: 0 };
  }

  const qs = new URLSearchParams();
  if (opts.marketplaceAccountId != null && String(opts.marketplaceAccountId).trim() !== "") {
    qs.set("marketplaceAccountId", String(opts.marketplaceAccountId).trim());
  }
  if (opts.sellerCompanyId != null && String(opts.sellerCompanyId).trim() !== "") {
    qs.set("sellerCompanyId", String(opts.sellerCompanyId).trim());
  }
  const url = qs.toString() ? `${base}?${qs.toString()}` : base;

  const token = await getSessionToken();
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data?.error === "string" ? data.error : `Erro ${res.status}`,
      status: res.status,
      data,
    };
  }
  return { ok: true, data, status: res.status };
}

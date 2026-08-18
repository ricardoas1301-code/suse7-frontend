// ======================================================
// API — Auditoria Administrativa Global — S1_5
// ------------------------------------------------------
// Leitura da trilha de auditoria administrativa (timeline).
// ======================================================

import { buildApiUrl, apiFetch } from "../config/api";

const BASE = "/api/dev-center/admin/audit";

/**
 * Lista a auditoria administrativa recente.
 * @param {{ limit?: number; entity?: string; onlyCritical?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean; entries?: object[]; degraded?: boolean; error?: string; status: number }>}
 */
export async function fetchAdminAudit(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.entity) params.set("entity", opts.entity);
  if (opts.onlyCritical) params.set("critical", "true");
  const qs = params.toString();
  const url = buildApiUrl(`${BASE}${qs ? `?${qs}` : ""}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return {
    ok: true,
    entries: Array.isArray(res.data?.entries) ? res.data.entries : [],
    degraded: Boolean(res.data?.degraded),
    status: res.status,
  };
}

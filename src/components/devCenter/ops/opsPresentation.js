// =============================================================================
// Dev Center Ops — mapeamento visual (sem recalcular métricas no frontend)
// =============================================================================

const DASH = "—";

export function formatPtDate(iso) {
  if (!iso) return DASH;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return DASH;
  return new Date(t).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatPtDateShort(iso) {
  if (!iso) return DASH;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return DASH;
  return new Date(t).toLocaleDateString("pt-BR");
}

/** @param {string | null | undefined} status */
export function ingestionHealthLabel(status) {
  const map = {
    healthy: "Saudável",
    degraded: "Degradada",
    critical: "Crítica",
    unknown: "Indeterminada",
  };
  return map[String(status ?? "").toLowerCase()] ?? DASH;
}

/** @param {string | null | undefined} status */
export function dataQualityLabel(status) {
  const map = {
    good: "Boa",
    fair: "Regular",
    poor: "Baixa",
    unknown: "Indeterminada",
  };
  return map[String(status ?? "").toLowerCase()] ?? DASH;
}

/** @param {string | null | undefined} code */
export function issueCodeLabel(code) {
  const map = {
    missing_email: "E-mail ausente",
    missing_phone: "Telefone ausente",
    missing_city: "Cidade ausente",
    missing_state: "Estado ausente",
    missing_zip_code: "CEP ausente",
    missing_document: "Documento ausente",
    suspicious_duplicate_document: "Documento duplicado (suspeita)",
    suspicious_duplicate_email: "E-mail duplicado (suspeita)",
    missing_last_purchase: "Última compra indisponível",
  };
  return map[String(code ?? "")] ?? String(code ?? DASH);
}

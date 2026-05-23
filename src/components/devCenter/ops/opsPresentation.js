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

/** @param {string | null | undefined} reason — contrato detail (not_available) */
export function contractUnavailableLabel(reason) {
  const map = {
    per_customer_quality_not_computed: "Não calculado por cliente",
    per_customer_ingestion_not_computed: "Escopo seller (não agregado)",
  };
  const key = String(reason ?? "").trim();
  return key && map[key] ? map[key] : "Indisponível";
}

/** @param {string | null | undefined} iso */
export function formatRelativeUpdated(iso) {
  if (!iso) return DASH;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return DASH;
  const hours = Math.max(0, Math.round((Date.now() - t) / (60 * 60 * 1000)));
  if (hours < 1) return "Atualizado há menos de 1 hora";
  if (hours === 1) return "Atualizado há 1 hora";
  return `Atualizado há ${hours} horas`;
}

/** @param {string | null | undefined} reason — metadata.sync.stale_reason */
export function syncStaleReasonLabel(reason) {
  const map = {
    global_record_older_than_last_purchase: "Registro global anterior à última compra",
    updated_at_unavailable: "Indisponível",
  };
  const key = String(reason ?? "").trim();
  return key && map[key] ? map[key] : DASH;
}

// =============================================================================
// Dev Center Ops — mapeamento visual (sem recalcular métricas no frontend)
// =============================================================================

const DASH = "—";

/** Valor mascarado ou campo LGPD ausente — neutro, sem culpar o usuário. */
export function formatOptionalMasked(value) {
  const s = String(value ?? "").trim();
  return s || "Não informado";
}

/** Contagem opcional — evita 0 enganoso quando o campo não veio no contrato. */
export function formatOptionalCount(value) {
  if (value == null || value === "") return DASH;
  const n = Number(value);
  if (!Number.isFinite(n)) return DASH;
  return String(n);
}

/** Valor monetário opcional — sem NaN na UI. */
export function formatOptionalMoney(value) {
  if (value == null || value === "") return DASH;
  const n = Number(value);
  if (Number.isFinite(n)) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  const s = String(value).trim();
  return s || DASH;
}

/** Texto genérico seguro — nunca renderiza undefined/null. */
export function formatOptionalText(value) {
  const s = String(value ?? "").trim();
  return s || DASH;
}

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
    per_customer_quality_not_computed: "Informação ainda não calculada",
    per_customer_ingestion_not_computed: "Dados agregados indisponíveis",
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

/**
 * Rótulo de freshness do drawer (S_4.7.3) — percepção de atualização, sem score.
 * @param {number | null | undefined} fetchedAt — epoch ms do cache/rede
 * @param {Record<string, unknown> | null | undefined} contract
 * @param {{ revalidating?: boolean }} [opts]
 */
export function formatDetailFreshnessLabel(fetchedAt, contract, opts = {}) {
  if (opts.revalidating) return "Atualizando…";
  if (isDetailContractSyncStale(contract)) return "Pode estar desatualizado";

  if (fetchedAt == null || !Number.isFinite(fetchedAt)) return null;

  const min = Math.max(0, Math.round((Date.now() - fetchedAt) / 60_000));
  if (min < 1) return "Atualizado agora";
  if (min === 1) return "Atualizado há 1 min";
  return `Atualizado há ${min} min`;
}

/** @param {Record<string, unknown> | null | undefined} contract */
export function isDetailContractSyncStale(contract) {
  const sync = /** @type {Record<string, unknown> | undefined} */ (contract?.metadata)?.sync;
  return sync?.stale === true;
}

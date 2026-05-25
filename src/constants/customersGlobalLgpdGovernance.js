// =============================================================================
// Dev Center S_4.8.1 — Governança LGPD (documentação viva)
// Domínio: admin global — GET /api/dev-center/customers-global[/:id]
// =============================================================================

/** @typedef {"public" | "masked" | "internal" | "prohibited"} LgpdFieldClass */

/**
 * @typedef {Readonly<{
 *   field: string;
 *   block: string;
 *   origin: string;
 *   classification: LgpdFieldClass;
 *   canExpose: boolean;
 *   masked: boolean;
 *   surfaces: readonly string[];
 *   notes?: string;
 * }>} LgpdFieldRecord
 */

/** Campos que NUNCA devem aparecer em API, cache, UI ou logs. */
export const CUSTOMERS_GLOBAL_LGPD_PROHIBITED = Object.freeze([
  "document_normalized",
  "email_normalized",
  "phone_normalized",
  "dedupe_key",
  "document_raw",
  "email_raw",
  "phone_raw",
]);

/**
 * Inventário de campos expostos — S_4.8.1.
 * @type {readonly LgpdFieldRecord[]}
 */
export const CUSTOMERS_GLOBAL_LGPD_INVENTORY = Object.freeze([
  {
    field: "id",
    block: "customer",
    origin: "s7_global_customers.id",
    classification: "internal",
    canExpose: true,
    masked: false,
    surfaces: ["list", "drawer", "cache"],
    notes: "UUID — truncado na UI do drawer (8 chars)",
  },
  {
    field: "name",
    block: "customer",
    origin: "s7_global_customers.name",
    classification: "public",
    canExpose: true,
    masked: false,
    surfaces: ["list", "drawer", "cache"],
    notes: "Identificação direta — base legal admin operacional",
  },
  {
    field: "document",
    block: "list",
    origin: "maskDocumentForApi(document_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["list"],
    notes: "Lista usa chave document (valor já mascarado no backend)",
  },
  {
    field: "document_masked",
    block: "customer",
    origin: "maskDocumentForApi(document_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["drawer", "cache"],
  },
  {
    field: "email",
    block: "list",
    origin: "maskEmailForApi(email_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["list"],
  },
  {
    field: "email_masked",
    block: "customer",
    origin: "maskEmailForApi(email_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["drawer", "cache"],
  },
  {
    field: "phone",
    block: "list",
    origin: "maskPhoneForApi(phone_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["list"],
  },
  {
    field: "phone_masked",
    block: "customer",
    origin: "maskPhoneForApi(phone_normalized)",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["drawer", "cache"],
  },
  {
    field: "document_normalized",
    block: "—",
    origin: "DB",
    classification: "prohibited",
    canExpose: false,
    masked: false,
    surfaces: [],
    notes: "Somente servidor — busca q e máscara",
  },
  {
    field: "email_normalized",
    block: "—",
    origin: "DB",
    classification: "prohibited",
    canExpose: false,
    masked: false,
    surfaces: [],
  },
  {
    field: "phone_normalized",
    block: "—",
    origin: "DB",
    classification: "prohibited",
    canExpose: false,
    masked: false,
    surfaces: [],
  },
  {
    field: "dedupe_key",
    block: "—",
    origin: "DB",
    classification: "prohibited",
    canExpose: false,
    masked: false,
    surfaces: [],
    notes: "Substituído por metadata.dedupe_strategy (enum)",
  },
  {
    field: "dedupe_strategy",
    block: "metadata",
    origin: "dedupeStrategyFromKey(dedupe_key)",
    classification: "internal",
    canExpose: true,
    masked: false,
    surfaces: ["drawer", "cache"],
  },
  {
    field: "overview.contact",
    block: "overview",
    origin: "flags has_email/has_phone/incomplete",
    classification: "internal",
    canExpose: true,
    masked: false,
    surfaces: ["drawer", "cache"],
    notes: "Sem texto de e-mail/telefone",
  },
  {
    field: "external_customer_id",
    block: "activity",
    origin: "related_sellers JSON",
    classification: "masked",
    canExpose: true,
    masked: true,
    surfaces: ["drawer", "cache"],
    notes: "Referência marketplace — truncada na UI (S_4.8.1)",
  },
  {
    field: "quality / ingestion",
    block: "quality, ingestion",
    origin: "placeholder not_available",
    classification: "internal",
    canExpose: true,
    masked: false,
    surfaces: ["drawer", "cache"],
    notes: "Sem score por cliente",
  },
]);

/** Superfícies auditadas S_4.8.1 */
export const CUSTOMERS_GLOBAL_LGPD_SURFACES = Object.freeze({
  api: "Backend maskDocument/Email/Phone + sanitizeRelatedSellers",
  frontend: "OpsGlobal* — apenas campos mascarados no drawer",
  cache: "devCenterGlobalDetailCache — Map in-memory, TTL 90s, max 8, sem storage",
  console: "Sem console.log de payload cliente no fluxo Dev Center",
  error: "Mensagens genéricas; front sanitiza error string",
  network: "HTTPS — contrato mascarado",
  logs: "Backend: traceId + message, sem row/customer",
});

/**
 * Verifica se um payload serializado contém campo proibido ou valor cru típico.
 * @param {unknown} payload
 * @returns {{ ok: boolean; violations: string[] }}
 */
export function auditCustomersGlobalPayload(payload) {
  /** @type {string[]} */
  const violations = [];
  const json = JSON.stringify(payload ?? {});

  for (const key of CUSTOMERS_GLOBAL_LGPD_PROHIBITED) {
    if (json.includes(`"${key}"`)) {
      violations.push(`prohibited_key:${key}`);
    }
  }

  return { ok: violations.length === 0, violations };
}

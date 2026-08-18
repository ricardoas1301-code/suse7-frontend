// ======================================================================
// Formas de pagamento — normalização visual (sem regra de cobrança)
// ======================================================================

/**
 * @typedef {{
 *   id: string;
 *   provider: string;
 *   method_type: string;
 *   brand: string | null;
 *   last4: string | null;
 *   holder_name: string | null;
 *   expiration_month: string | null;
 *   expiration_year: string | null;
 *   expires_at: string | null;
 *   card_type: "CREDIT" | "DEBIT";
 *   supports_auto_renew: boolean;
 *   is_default: boolean;
 *   status: string;
 * }} BillingPaymentMethod
 */

const METHOD_TYPE_LABELS = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "PIX",
  boleto: "Boleto",
};

const STATUS_LABELS = {
  active: "Ativo",
  pending: "Pendente",
  expired: "Expirado",
  failed: "Falhou",
  disabled: "Indisponível",
};

/**
 * @param {BillingPaymentMethod | null | undefined} method
 * @returns {"CREDIT" | "DEBIT"}
 */
export function resolvePaymentMethodCardType(method) {
  if (!method) return "CREDIT";
  if (method.card_type === "DEBIT" || method.card_type === "CREDIT") return method.card_type;
  const methodType = String(method.method_type || "").toLowerCase();
  if (methodType.includes("debit")) return "DEBIT";
  return "CREDIT";
}

/**
 * @param {unknown} value
 */
export function normalizePaymentMethod(value) {
  if (!value || typeof value !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (value);
  const id = row.id != null ? String(row.id).trim() : "";
  if (!id) return null;

  return {
    id,
    provider: row.provider != null ? String(row.provider).trim() : "unknown",
    method_type: row.method_type != null ? String(row.method_type).trim().toLowerCase() : "unknown",
    brand: row.brand != null && String(row.brand).trim() !== "" ? String(row.brand).trim() : null,
    last4: row.last4 != null && String(row.last4).trim() !== "" ? String(row.last4).trim() : null,
    holder_name: row.holder_name != null && String(row.holder_name).trim() !== "" ? String(row.holder_name).trim() : null,
    expiration_month:
      row.expiration_month != null && String(row.expiration_month).trim() !== ""
        ? String(row.expiration_month).trim()
        : null,
    expiration_year:
      row.expiration_year != null && String(row.expiration_year).trim() !== ""
        ? String(row.expiration_year).trim()
        : null,
    expires_at: row.expires_at != null && String(row.expires_at).trim() !== "" ? String(row.expires_at).trim() : null,
    card_type:
      String(row.card_type || "").toUpperCase() === "DEBIT"
        ? "DEBIT"
        : String(row.card_type || "").toUpperCase() === "CREDIT"
          ? "CREDIT"
          : String(row.method_type || "").toLowerCase().includes("debit")
            ? "DEBIT"
            : "CREDIT",
    supports_auto_renew:
      typeof row.supports_auto_renew === "boolean"
        ? row.supports_auto_renew
        : String(row.card_type || "").toUpperCase() !== "DEBIT" &&
          !String(row.method_type || "").toLowerCase().includes("debit"),
    is_default: Boolean(row.is_default),
    status: row.status != null ? String(row.status).trim().toLowerCase() : "unknown",
  };
}

/**
 * @param {unknown} payload
 */
export function normalizePaymentMethodsList(payload) {
  const list = Array.isArray(payload?.payment_methods)
    ? payload.payment_methods
    : Array.isArray(payload)
      ? payload
      : [];
  return list.map((item) => normalizePaymentMethod(item)).filter(Boolean);
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 */
export function formatPaymentMethodExpiry(method) {
  if (method?.expiration_month && method?.expiration_year) {
    const yy = String(method.expiration_year).slice(-2);
    return `${method.expiration_month.padStart(2, "0")}/${yy}`;
  }
  if (!method?.expires_at) return "—";
  const date = new Date(method.expires_at);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 */
export function formatPaymentMethodTitle(method) {
  if (!method) return "Forma de pagamento";
  if (method.method_type === "pix") return "PIX automático";
  if (method.method_type === "boleto") return "Boleto bancário";
  if (method.brand && method.last4) return `${method.brand} final ${method.last4}`;
  if (method.last4) return `Cartão final ${method.last4}`;
  return METHOD_TYPE_LABELS[method.method_type] ?? "Forma de pagamento";
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 */
export function formatPaymentMethodTypeLabel(method) {
  if (!method) return "Método";
  const cardType = resolvePaymentMethodCardType(method);
  if (cardType === "DEBIT") return "Cartão de débito";
  if (cardType === "CREDIT") return "Cartão de crédito";
  return METHOD_TYPE_LABELS[method.method_type] ?? "Método";
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 */
export function formatPaymentMethodStatusLabel(method) {
  if (!method?.status) return "—";
  return STATUS_LABELS[method.status] ?? method.status;
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 */
export function getPaymentMethodStatusTone(method) {
  const status = String(method?.status || "").toLowerCase();
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "expired" || status === "failed") return "danger";
  return "muted";
}

export function getPaymentMethodActionLabels() {
  return {
    makeDefault: "Tornar principal",
    primary: "Principal",
    remove: "Remover",
    update: "Atualizar cartão",
    details: "Ver detalhes",
    retryCharge: "Tentar cobrança novamente",
  };
}

/**
 * @param {BillingPaymentMethod | null | undefined} method
 * @param {number} totalMethodsCount
 */
export function buildPaymentMethodRemoveDescription(method, totalMethodsCount) {
  const maskedTitle = formatPaymentMethodTitle(method);
  const hasOtherMethods = Number(totalMethodsCount) > 1;

  if (hasOtherMethods) {
    return `O cartão ${maskedTitle} será removido. As próximas cobranças usarão outra forma de pagamento disponível.`;
  }

  return `O cartão ${maskedTitle} será removido. Depois disso, não haverá uma forma de pagamento cadastrada para futuras cobranças.`;
}

/**
 * Pré-visualização local para validar cards sem tokenização persistida.
 * @returns {BillingPaymentMethod[]}
 */
export function buildPaymentMethodPreviewSamples() {
  return [
    {
      id: "preview-card",
      provider: "asaas",
      method_type: "credit_card",
      brand: "Visa",
      last4: "4587",
      holder_name: "Titular da conta",
      expires_at: "2029-08-01T00:00:00.000Z",
      is_default: true,
      status: "active",
    },
    {
      id: "preview-pix",
      provider: "asaas",
      method_type: "pix",
      brand: null,
      last4: null,
      holder_name: null,
      expires_at: null,
      is_default: false,
      status: "active",
    },
  ];
}

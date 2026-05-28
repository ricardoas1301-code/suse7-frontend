// ======================================================================
// Checkout UI — resposta sanitizada do backend
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutInvoiceUrl(checkout) {
  return pickCheckoutBoletoUrl(checkout);
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 */
export function pickPaymentBoletoUrl(payment) {
  if (!payment || typeof payment !== "object") return null;
  const bankSlipUrl = payment.bank_slip_url ?? payment.bankSlipUrl;
  const invoiceUrl = payment.invoice_url ?? payment.invoiceUrl;
  const explicit = payment.boleto_url;
  const candidates = [explicit, bankSlipUrl, invoiceUrl];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate.trim();
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 */
export function pickPaymentLinhaDigitavel(payment) {
  if (!payment || typeof payment !== "object") return null;
  const candidates = [
    payment.identification_field,
    payment.identificationField,
    payment.bank_slip_identification_field,
    payment.bankSlipIdentificationField,
    payment.linha_digitavel,
    payment.linhaDigitavel,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate.trim();
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutBoletoUrl(checkout) {
  const payment = checkout?.payment;
  return pickPaymentBoletoUrl(payment);
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutLinhaDigitavel(checkout) {
  const payment = checkout?.payment;
  return pickPaymentLinhaDigitavel(payment);
}

/**
 * @param {string | null | undefined} url
 */
export function inferBillingSandboxFromUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return false;
  const lower = url.toLowerCase();
  return lower.includes("sandbox.asaas.com") || lower.includes("api-sandbox.asaas.com");
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 * @param {{ planName?: string | null }} [options]
 */
export function buildBoletoCheckoutView(checkout, options = {}) {
  const payment = checkout?.payment && typeof checkout.payment === "object" ? checkout.payment : null;
  const plan = checkout?.plan && typeof checkout.plan === "object" ? checkout.plan : null;
  const boletoUrl = pickPaymentBoletoUrl(payment);
  const linhaDigitavel = pickPaymentLinhaDigitavel(payment);

  return {
    payment,
    plan,
    planName: options.planName || payment?.plan_name || plan?.name || "Plano",
    value: payment?.value ?? plan?.price_monthly ?? null,
    dueDate: payment?.due_date ?? null,
    statusLabel: "Aguardando pagamento",
    providerPaymentId: pickCheckoutProviderPaymentId(checkout),
    boletoUrl,
    linhaDigitavel,
    hasOfficialUrl: Boolean(boletoUrl),
    hasLinhaDigitavel: Boolean(linhaDigitavel),
    isSandbox: options.isSandbox ?? inferBillingSandboxFromUrl(boletoUrl),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutPixCopy(checkout) {
  const pixBlock = checkout?.pix;
  if (pixBlock && typeof pixBlock === "object") {
    const fromPix = pixBlock.copy_paste_code;
    if (typeof fromPix === "string" && fromPix.trim() !== "") return fromPix.trim();
  }
  const payment = checkout?.payment;
  if (!payment || typeof payment !== "object") return null;
  const pix = payment.pix_copy_paste;
  return typeof pix === "string" && pix.trim() !== "" ? pix.trim() : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutPixQrImage(checkout) {
  const pixBlock = checkout?.pix;
  if (!pixBlock || typeof pixBlock !== "object") return null;
  const img = pixBlock.qr_code_image;
  if (typeof img !== "string" || img.trim() === "") return null;
  const trimmed = img.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function pickCheckoutProviderPaymentId(checkout) {
  const payment = checkout?.payment;
  if (!payment || typeof payment !== "object") return null;
  const id = payment.provider_payment_id;
  return typeof id === "string" && id.trim() !== "" ? id.trim() : null;
}

/**
 * @param {{ slug?: string | null; plan_key?: string | null }} plan
 */
export function resolveCheckoutPlanSlug(plan) {
  if (!plan || typeof plan !== "object") return "";
  const slug = typeof plan.slug === "string" ? plan.slug.trim() : "";
  if (slug) return slug;
  const planKey = typeof plan.plan_key === "string" ? plan.plan_key.trim() : "";
  return planKey;
}

/**
 * Checkout com cobrança gerada e aguardando confirmação (Pix, boleto, etc.).
 * @param {Record<string, unknown> | null | undefined} checkout
 */
/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
export function isCardCheckoutApproved(checkout) {
  if (!checkout || typeof checkout !== "object") return false;
  const card = checkout.card;
  if (card && typeof card === "object" && /** @type {{ approved?: unknown }} */ (card).approved === true) {
    return true;
  }
  const sub = checkout.subscription;
  if (sub && typeof sub === "object") {
    const status = String(/** @type {{ status?: unknown }} */ (sub).status || "").toLowerCase();
    if (status === "active") return true;
  }
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} checkout
 */
/**
 * Monta objeto compatível com PixCheckoutModal a partir do payment do status API.
 * @param {Record<string, unknown> | null | undefined} payment
 * @param {string | null | undefined} planName
 */
export function buildPendingPixCheckoutFromPayment(payment, planName) {
  if (!payment || typeof payment !== "object") return null;
  const pix =
    payment.pix_qr_code || payment.pix_copy_paste
      ? {
          qr_code_image: payment.pix_qr_code ?? null,
          copy_paste_code: payment.pix_copy_paste ?? null,
        }
      : null;
  return {
    kind: "paid",
    payment: {
      provider_payment_id: payment.provider_payment_id ?? null,
      value: payment.value ?? payment.amount ?? null,
      due_date: payment.due_date ?? null,
      plan_name: planName ?? null,
    },
    ...(pix ? { pix } : {}),
  };
}

export function isCheckoutAwaitingPayment(checkout) {
  if (!checkout || typeof checkout !== "object") return false;
  const kind = String(checkout.kind ?? "")
    .trim()
    .toLowerCase();
  if (kind === "internal_free") return false;
  if (isCardCheckoutApproved(checkout)) return false;
  if (kind === "paid") return true;
  if (checkout.access_pending_confirmation === true) return true;
  if (["upgrade_checkout", "checkout"].includes(kind) && checkout.payment) return true;
  const payment = checkout.payment;
  return Boolean(
    payment &&
      typeof payment === "object" &&
      typeof /** @type {{ provider_payment_id?: unknown }} */ (payment).provider_payment_id === "string" &&
      String(/** @type {{ provider_payment_id?: string }} */ (payment).provider_payment_id).trim() !== ""
  );
}

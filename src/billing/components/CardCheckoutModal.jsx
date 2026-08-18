import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { S7Button } from "../../components/ui";
import suse7Logo from "../../assets/suse7-logo-redonda.png";
import {
  buildCardApiPayload,
  formatCardExpiry,
  formatCardNumber,
  formatCpfCnpj,
} from "../cardFormUi";
import { formatPlanDisplayName, formatPlanPriceBRL } from "../billingFormatters";
import { formatPaymentMethodTitle, resolvePaymentMethodCardType } from "../paymentMethodUi";
import "./CardCheckoutModal.css";

function RequiredFieldLabel({ children }) {
  return (
    <span className="s7-billing-card-checkout__field-label">
      {children}
      <span className="s7-billing-card-checkout__field-required" aria-hidden="true">
        *
      </span>
    </span>
  );
}

const EMPTY_FORM = {
  holder_name: "",
  card_number: "",
  expiry: "",
  cvv: "",
  cpf_cnpj: "",
  set_default: true,
  save_card: true,
};

function buildEmptyForm(hasExistingCards) {
  return {
    ...EMPTY_FORM,
    set_default: !hasExistingCards,
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const CARD_CHECKOUT_BASE_SCALE = 0.84;
const CARD_CHECKOUT_VIEWPORT_MARGIN_PX = 32;

function obterAlturaTopNavPx() {
  if (typeof window === "undefined") return 64;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--s7-topnav-bar-height").trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 64;
}

/**
 * @param {{
 *   open: boolean;
 *   mode?: "checkout" | "save";
 *   planName?: string;
 *   planValue?: string | number | null;
 *   savedMethods?: import("../paymentMethodUi").BillingPaymentMethod[];
 *   loading?: boolean;
 *   errorMessage?: string | null;
 *   onClose: () => void;
 *   onSubmit: (payload: {
 *     payment_method_id?: string;
 *     card?: Record<string, unknown>;
 *     cpf_cnpj?: string;
 *     card_type?: "credit";
 *     set_default?: boolean;
 *     persist?: boolean;
 *     idempotency_key?: string;
 *   }) => void | Promise<void>;
 * }} props
 */
export default function CardCheckoutModal({
  open,
  mode = "checkout",
  planName,
  planValue = null,
  savedMethods = [],
  loading = false,
  errorMessage = null,
  onClose,
  onSubmit,
}) {
  const creditCards = useMemo(
    () => savedMethods.filter((m) => resolvePaymentMethodCardType(m) === "CREDIT"),
    [savedMethods]
  );
  const defaultSaved = creditCards.find((m) => m.is_default) ?? creditCards[0] ?? null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [useNewCard, setUseNewCard] = useState(true);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationBanner, setValidationBanner] = useState(null);
  const fitHostRef = useRef(null);
  const panelRef = useRef(null);
  const idempotencyKeyRef = useRef(/** @type {string | null} */ (null));

  const isSaveMode = mode === "save";
  const displayPlanName = useMemo(() => formatPlanDisplayName(planName || "Plano"), [planName]);

  const aplicarEscalaModal = useCallback(() => {
    if (isSaveMode) return;

    const panel = panelRef.current;
    const fitHost = fitHostRef.current;
    const sheet = fitHost?.closest(".s7-billing-card-checkout-sheet");
    if (!panel) return;

    panel.style.zoom = "1";
    panel.style.transform = "none";

    const topNavHeight = obterAlturaTopNavPx();
    const alturaDisponivel = window.innerHeight - CARD_CHECKOUT_VIEWPORT_MARGIN_PX - topNavHeight;
    const larguraDisponivel = window.innerWidth - CARD_CHECKOUT_VIEWPORT_MARGIN_PX;
    const alturaNatural = panel.scrollHeight;
    const larguraNatural = panel.offsetWidth;

    if (!alturaNatural || !larguraNatural) return;

    const escalaViewport = Math.min(
      1,
      alturaDisponivel / alturaNatural,
      larguraDisponivel / larguraNatural
    );
    const escalaFinal = escalaViewport * CARD_CHECKOUT_BASE_SCALE;
    const alturaVisual = alturaNatural * escalaFinal;

    panel.style.setProperty("--s7-card-checkout-fit-scale", String(escalaFinal));

    if (typeof CSS !== "undefined" && CSS.supports("zoom", "1")) {
      panel.style.zoom = String(escalaFinal);
      panel.style.transform = "none";
    } else {
      panel.style.zoom = "";
      panel.style.transform = `scale(${escalaFinal})`;
      panel.style.transformOrigin = "center center";
    }

    if (sheet && fitHost) {
      const cabeNaViewport = alturaVisual <= alturaDisponivel;
      sheet.style.alignItems = cabeNaViewport ? "center" : "flex-start";
      sheet.style.justifyContent = "center";
      sheet.style.overflowY = cabeNaViewport ? "hidden" : "auto";
      fitHost.style.marginTop = cabeNaViewport ? "auto" : "0";
      fitHost.style.marginBottom = cabeNaViewport ? "auto" : "0";
    }
  }, [isSaveMode]);

  useEffect(() => {
    if (!open) {
      idempotencyKeyRef.current = null;
      return;
    }
    idempotencyKeyRef.current = createIdempotencyKey();
    setForm(buildEmptyForm(creditCards.length > 0));
    setFieldErrors({});
    setValidationBanner(null);
  }, [open, creditCards.length]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isSaveMode) {
      setUseNewCard(true);
      setSelectedSavedId("");
      return;
    }
    const initial = defaultSaved ?? null;
    setUseNewCard(!initial);
    setSelectedSavedId(initial?.id ?? "");
  }, [open, isSaveMode, defaultSaved?.id]);

  useEffect(() => {
    if (!open || isSaveMode) return;

    let observer = null;

    const measureFrame = window.requestAnimationFrame(() => {
      aplicarEscalaModal();
      window.requestAnimationFrame(() => {
        aplicarEscalaModal();
        if (panelRef.current && typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => aplicarEscalaModal());
          observer.observe(panelRef.current);
        }
      });
    });

    window.addEventListener("resize", aplicarEscalaModal);

    return () => {
      window.cancelAnimationFrame(measureFrame);
      window.removeEventListener("resize", aplicarEscalaModal);
      observer?.disconnect();

      const panel = panelRef.current;
      if (panel) {
        panel.style.zoom = "";
        panel.style.transform = "";
        panel.style.transformOrigin = "";
        panel.style.removeProperty("--s7-card-checkout-fit-scale");
      }

      const fitHost = fitHostRef.current;
      const sheet = fitHost?.closest(".s7-billing-card-checkout-sheet");
      if (sheet) {
        sheet.style.alignItems = "";
        sheet.style.justifyContent = "";
        sheet.style.overflowY = "";
      }
      if (fitHost) {
        fitHost.style.marginTop = "";
        fitHost.style.marginBottom = "";
      }
    };
  }, [open, aplicarEscalaModal, errorMessage, useNewCard, loading, fieldErrors, isSaveMode]);

  if (!open) return null;

  const title = isSaveMode ? "Adicionar cartão de crédito" : "Pagamento com cartão de crédito";
  const statusLabel = "Confirme o pagamento";
  const statusClass = "s7-billing-card-checkout__status";

  const primaryLabel = isSaveMode
    ? loading
      ? "Salvando cartão…"
      : "Salvar cartão de crédito"
    : loading
      ? "Processando pagamento…"
      : useNewCard
        ? "Pagar com cartão de crédito"
        : "Pagar com cartão salvo";

  const steps = isSaveMode
    ? [
        "Informe nome, número, validade e CVV do cartão.",
        "CPF/CNPJ do titular é obrigatório para tokenização segura.",
        "O cartão pode ser usado em cobranças recorrentes mensais.",
      ]
    : [
        "Revise os dados do titular e do cartão de crédito.",
        "Aprovação imediata após confirmação do emissor.",
        "A confirmação libera o acesso e prepara renovação mensal.",
      ];

  function fieldClass(name) {
    return fieldErrors[name]
      ? "s7-billing-card-checkout__field s7-billing-card-checkout__field--error"
      : "s7-billing-card-checkout__field";
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationBanner(null);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});
    setValidationBanner(null);

    if (!isSaveMode && !useNewCard && selectedSavedId) {
      await onSubmit({
        payment_method_id: selectedSavedId,
        card_type: "credit",
        set_default: form.set_default,
        persist: false,
        idempotency_key: idempotencyKeyRef.current ?? createIdempotencyKey(),
      });
      return;
    }

    const built = buildCardApiPayload(form);
    if (!built.ok) {
      setFieldErrors(built.errors);
      setValidationBanner("Confira os campos destacados.");
      return;
    }

    await onSubmit({
      card: built.payload,
      cpf_cnpj: built.payload.cpf_cnpj,
      card_type: "credit",
      set_default: built.payload.set_default,
      persist: built.payload.persist,
      idempotency_key: idempotencyKeyRef.current ?? createIdempotencyKey(),
    });
  }

  return (
    <div
      className={`s7-billing-checkout-sheet s7-billing-card-checkout-sheet${
        isSaveMode ? " s7-billing-card-checkout-sheet--viewport-fill" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="s7-card-checkout-title"
      onClick={onClose}
    >
      <div
        className="s7-billing-card-checkout__fit-host"
        ref={fitHostRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="s7-billing-checkout-sheet__panel s7-billing-card-checkout" ref={panelRef}>
        <form className="s7-billing-card-checkout__layout" onSubmit={handleSubmit} noValidate>
          <aside
            className={`s7-billing-card-checkout__summary-col${
              isSaveMode ? " s7-billing-card-checkout__summary-col--save-mode" : ""
            }`}
            aria-label="Resumo"
          >
            <header className="s7-billing-card-checkout__summary-header">
              <div className="s7-billing-card-checkout__brand-stack">
                <img
                  className="s7-billing-card-checkout__suse7-logo"
                  src={suse7Logo}
                  alt="Suse7"
                  width={98}
                  height={98}
                  decoding="async"
                />
              </div>
              <h3 id="s7-card-checkout-title" className="s7-billing-card-checkout__title">
                {title}
              </h3>
              {!isSaveMode ? <p className={statusClass}>{statusLabel}</p> : null}
            </header>

            <dl className="s7-billing-card-checkout__facts">
              {isSaveMode ? (
                <>
                  <div className="s7-billing-card-checkout__fact s7-billing-card-checkout__fact--highlight">
                    <dt>Uso</dt>
                    <dd>Recorrente mensal</dd>
                  </div>
                  <div className="s7-billing-card-checkout__fact">
                    <dt>Proteção</dt>
                    <dd>Tokenização Asaas</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="s7-billing-card-checkout__fact s7-billing-card-checkout__fact--highlight">
                    <dt>Plano</dt>
                    <dd>{displayPlanName}</dd>
                  </div>
                  {planValue != null && planValue !== "" ? (
                    <div className="s7-billing-card-checkout__fact s7-billing-card-checkout__fact--highlight">
                      <dt>Valor</dt>
                      <dd>{formatPlanPriceBRL(planValue)}</dd>
                    </div>
                  ) : null}
                  <div className="s7-billing-card-checkout__fact">
                    <dt>Cobrança</dt>
                    <dd>Mensal recorrente</dd>
                  </div>
                </>
              )}
            </dl>
          </aside>

          <section className="s7-billing-card-checkout__payment-col" aria-label="Dados do cartão">
            <div className="s7-billing-card-checkout__form-card">
              {errorMessage ? <p className="s7-billing-card-checkout__banner-error">{errorMessage}</p> : null}
              {validationBanner ? (
                <p className="s7-billing-card-checkout__banner-error" role="alert">
                  {validationBanner}
                </p>
              ) : null}

              <div className="s7-billing-card-checkout__form-body">
              <div className="s7-billing-card-checkout__form">
                {!isSaveMode && creditCards.length > 0 ? (
                  <div className="s7-billing-card-checkout__saved" aria-label="Cartões salvos">
                    {creditCards.map((method) => (
                      <label
                        key={method.id}
                        className={`s7-billing-card-checkout__saved-option ${
                          !useNewCard && selectedSavedId === method.id
                            ? "s7-billing-card-checkout__saved-option--selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved_card"
                          checked={!useNewCard && selectedSavedId === method.id}
                          onChange={() => {
                            setUseNewCard(false);
                            setSelectedSavedId(method.id);
                          }}
                        />
                        <CreditCard size={16} aria-hidden="true" />
                        <span>{formatPaymentMethodTitle(method)}</span>
                      </label>
                    ))}
                    <label className="s7-billing-card-checkout__saved-option">
                      <input
                        type="radio"
                        name="saved_card"
                        checked={useNewCard}
                        onChange={() => setUseNewCard(true)}
                      />
                      <span>Cadastrar novo cartão</span>
                    </label>
                  </div>
                ) : null}

                {useNewCard || isSaveMode ? (
                  <>
                    <label className={fieldClass("holder_name")}>
                      <RequiredFieldLabel>Nome impresso no cartão</RequiredFieldLabel>
                      <input
                        name="holder_name"
                        autoComplete="cc-name"
                        value={form.holder_name}
                        onChange={(e) => updateField("holder_name", e.target.value)}
                        disabled={loading}
                      />
                      {fieldErrors.holder_name ? (
                        <span className="s7-billing-card-checkout__field-error">{fieldErrors.holder_name}</span>
                      ) : null}
                    </label>

                    <label className={fieldClass("card_number")}>
                      <RequiredFieldLabel>Número do cartão</RequiredFieldLabel>
                      <input
                        name="card_number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={form.card_number}
                        onChange={(e) => updateField("card_number", formatCardNumber(e.target.value))}
                        disabled={loading}
                      />
                      {fieldErrors.card_number ? (
                        <span className="s7-billing-card-checkout__field-error">{fieldErrors.card_number}</span>
                      ) : null}
                    </label>

                    <div className="s7-billing-card-checkout__field-row">
                      <label className={fieldClass("expiry")}>
                        <RequiredFieldLabel>Validade (MM/AA)</RequiredFieldLabel>
                        <input
                          name="expiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/AA"
                          value={form.expiry}
                          onChange={(e) => updateField("expiry", formatCardExpiry(e.target.value))}
                          disabled={loading}
                        />
                        {fieldErrors.expiry ? (
                          <span className="s7-billing-card-checkout__field-error">{fieldErrors.expiry}</span>
                        ) : null}
                      </label>
                      <label className={fieldClass("cvv")}>
                        <RequiredFieldLabel>CVV</RequiredFieldLabel>
                        <input
                          name="cvv"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          value={form.cvv}
                          onChange={(e) => updateField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                          disabled={loading}
                        />
                        {fieldErrors.cvv ? (
                          <span className="s7-billing-card-checkout__field-error">{fieldErrors.cvv}</span>
                        ) : null}
                      </label>
                    </div>

                    <label className={fieldClass("cpf_cnpj")}>
                      <RequiredFieldLabel>CPF/CNPJ do titular</RequiredFieldLabel>
                      <input
                        name="cpf_cnpj"
                        inputMode="numeric"
                        value={form.cpf_cnpj}
                        onChange={(e) => updateField("cpf_cnpj", formatCpfCnpj(e.target.value))}
                        disabled={loading}
                      />
                      {fieldErrors.cpf_cnpj ? (
                        <span className="s7-billing-card-checkout__field-error">{fieldErrors.cpf_cnpj}</span>
                      ) : null}
                    </label>

                    <label className="s7-billing-card-checkout__checkbox">
                      <input
                        type="checkbox"
                        checked={form.save_card}
                        onChange={(e) => updateField("save_card", e.target.checked)}
                        disabled={loading}
                      />
                      Salvar cartão para pagamentos futuros
                    </label>
                    <label className="s7-billing-card-checkout__checkbox">
                      <input
                        type="checkbox"
                        checked={form.set_default}
                        onChange={(e) => updateField("set_default", e.target.checked)}
                        disabled={loading}
                      />
                      Definir como cartão principal
                    </label>
                  </>
                ) : null}
              </div>
              </div>

              <div className="s7-billing-card-checkout__actions">
                <S7Button type="submit" variant="primary" disabled={loading}>
                  {primaryLabel}
                </S7Button>
              </div>
            </div>

            <ol className="s7-billing-card-checkout__steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <p className="s7-billing-card-checkout__footer">
            Seus dados são enviados com segurança ao provedor de pagamento. O Suse7 não armazena o número completo do
            cartão nem o CVV.
          </p>
        </form>
        </div>
      </div>
    </div>
  );
}

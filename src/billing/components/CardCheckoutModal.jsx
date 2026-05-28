import { useEffect, useMemo, useState } from "react";
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

  const isSaveMode = mode === "save";
  const displayPlanName = useMemo(() => formatPlanDisplayName(planName || "Plano"), [planName]);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setFieldErrors({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const initial = defaultSaved ?? null;
    setUseNewCard(!initial);
    setSelectedSavedId(initial?.id ?? "");
  }, [open, defaultSaved?.id]);

  if (!open) return null;

  const title = isSaveMode ? "Adicionar cartão de crédito" : "Pagamento com cartão de crédito";
  const statusLabel = isSaveMode ? "Cadastro seguro" : "Confirme o pagamento";
  const statusClass = isSaveMode
    ? "s7-billing-card-checkout__status s7-billing-card-checkout__status--secure"
    : "s7-billing-card-checkout__status";

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

    if (!useNewCard && selectedSavedId) {
      await onSubmit({
        payment_method_id: selectedSavedId,
        card_type: "credit",
        set_default: form.set_default,
        persist: false,
      });
      return;
    }

    const built = buildCardApiPayload(form);
    if (!built.ok) {
      setFieldErrors(built.errors);
      return;
    }

    await onSubmit({
      card: built.payload,
      cpf_cnpj: built.payload.cpf_cnpj,
      card_type: "credit",
      set_default: built.payload.set_default,
      persist: built.payload.persist,
    });
  }

  return (
    <div
      className="s7-billing-checkout-sheet s7-billing-card-checkout-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s7-card-checkout-title"
      onClick={onClose}
    >
      <div
        className="s7-billing-checkout-sheet__panel s7-billing-card-checkout"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="s7-billing-card-checkout__layout" onSubmit={handleSubmit} noValidate>
          <aside className="s7-billing-card-checkout__summary-col" aria-label="Resumo">
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
              <p className={statusClass}>{statusLabel}</p>
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
  );
}

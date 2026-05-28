import { useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import suse7Logo from "../../assets/suse7-logo-redonda.png";
import { formatPaymentDueDatePt, formatPlanDisplayName, formatPlanPriceBRL } from "../billingFormatters";
import {
  buildBoletoCheckoutView,
  pickPaymentBoletoUrl,
  pickPaymentLinhaDigitavel,
} from "../checkoutUi";
import { fetchBillingBoletoDetails } from "../services/billingApi";
import "./BillingBoletoModal.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   payment?: Record<string, unknown> | null;
 *   plan?: Record<string, unknown> | null;
 *   planName?: string | null;
 *   checkout?: Record<string, unknown> | null;
 *   isSandbox?: boolean;
 *   onPaymentConfirmed?: () => void | Promise<void>;
 * }} props
 */
export default function BillingBoletoModal({
  open,
  onClose,
  payment: paymentProp,
  plan: planProp,
  planName,
  checkout,
  isSandbox: isSandboxProp,
}) {
  const { addNotification } = useNotifications();
  const [copyLoading, setCopyLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [fetchedBoletoCode, setFetchedBoletoCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const view = useMemo(() => {
    if (checkout) return buildBoletoCheckoutView(checkout, { planName, isSandbox: isSandboxProp });
    const payment = paymentProp && typeof paymentProp === "object" ? paymentProp : null;
    const plan = planProp && typeof planProp === "object" ? planProp : null;
    const boletoUrl = pickPaymentBoletoUrl(payment);
    const linhaDigitavel = pickPaymentLinhaDigitavel(payment);
    return {
      payment,
      plan,
      planName: planName || payment?.plan_name || plan?.name || "Plano",
      value: payment?.value ?? payment?.amount ?? plan?.price_monthly ?? null,
      dueDate: payment?.due_date ?? null,
      statusLabel: "Aguardando pagamento",
      providerPaymentId:
        typeof payment?.provider_payment_id === "string" ? payment.provider_payment_id.trim() : null,
      boletoUrl,
      linhaDigitavel,
      hasOfficialUrl: Boolean(boletoUrl),
      hasLinhaDigitavel: Boolean(linhaDigitavel),
      isSandbox: isSandboxProp ?? false,
    };
  }, [checkout, paymentProp, planProp, planName, isSandboxProp]);

  const effectiveBoletoCode = view.linhaDigitavel || fetchedBoletoCode;
  const dueDateLabel = useMemo(() => formatPaymentDueDatePt(view.dueDate), [view.dueDate]);
  const displayPlanName = useMemo(() => formatPlanDisplayName(view.planName), [view.planName]);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setFetchedBoletoCode(null);

    const initialCode = view.linhaDigitavel;
    if (initialCode || !view.providerPaymentId) return;

    let active = true;
    setCodeLoading(true);
    (async () => {
      const res = await fetchBillingBoletoDetails({ provider_payment_id: view.providerPaymentId });
      if (!active) return;
      setCodeLoading(false);
      if (!res.ok || !res.data?.boleto) return;
      const code =
        typeof res.data.boleto.identification_field === "string"
          ? res.data.boleto.identification_field.trim()
          : "";
      if (code) setFetchedBoletoCode(code);
    })();

    return () => {
      active = false;
    };
  }, [open, view.linhaDigitavel, view.providerPaymentId]);

  if (!open) return null;

  async function resolveBoletoCodeForCopy() {
    if (effectiveBoletoCode) return effectiveBoletoCode;
    if (!view.providerPaymentId) return null;

    const res = await fetchBillingBoletoDetails({ provider_payment_id: view.providerPaymentId });
    if (!res.ok || !res.data?.boleto) return null;
    const code =
      typeof res.data.boleto.identification_field === "string"
        ? res.data.boleto.identification_field.trim()
        : "";
    if (code) setFetchedBoletoCode(code);
    return code || null;
  }

  async function handleCopyBoletoCode() {
    if (copyLoading || codeLoading) return;
    setCopyLoading(true);
    try {
      const code = (await resolveBoletoCodeForCopy()) || effectiveBoletoCode;
      if (!code) {
        addNotification({
          event_type: "BILLING_BOLETO_COPY_ERROR",
          entity_type: "billing",
          title: "Código indisponível",
          message: "Aguarde alguns instantes e tente novamente.",
          severity: "warning",
        });
        return;
      }
      await navigator.clipboard.writeText(code);
      setCopied(true);
      addNotification({
        event_type: "BILLING_BOLETO_COPIED",
        entity_type: "billing",
        title: "Código do boleto copiado",
        message: "Cole no app do seu banco ou internet banking para pagar o boleto.",
        severity: "success",
      });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      addNotification({
        event_type: "BILLING_BOLETO_COPY_ERROR",
        entity_type: "billing",
        title: "Não foi possível copiar",
        message: "Copie manualmente o código na página do boleto.",
        severity: "error",
      });
    } finally {
      setCopyLoading(false);
    }
  }

  function downloadBoleto() {
    if (!view.boletoUrl) return;
    window.open(view.boletoUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="s7-billing-checkout-sheet s7-billing-boleto-checkout-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s7-boleto-checkout-title"
      onClick={onClose}
    >
      <div
        className="s7-billing-checkout-sheet__panel s7-billing-boleto-checkout"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="s7-billing-boleto-checkout__layout">
          <aside className="s7-billing-boleto-checkout__summary-col" aria-label="Resumo do pagamento">
            <header className="s7-billing-boleto-checkout__summary-header">
              <div className="s7-billing-boleto-checkout__brand-stack">
                <img
                  className="s7-billing-boleto-checkout__suse7-logo"
                  src={suse7Logo}
                  alt="Suse7"
                  width={98}
                  height={98}
                  decoding="async"
                />
              </div>
              <h3 id="s7-boleto-checkout-title" className="s7-billing-boleto-checkout__title">
                Pagamento por boleto
              </h3>
              <p className="s7-billing-boleto-checkout__status">{view.statusLabel}</p>
            </header>

            <dl className="s7-billing-boleto-checkout__facts">
              <div className="s7-billing-boleto-checkout__fact s7-billing-boleto-checkout__fact--highlight">
                <dt>Plano</dt>
                <dd>{displayPlanName}</dd>
              </div>
              <div className="s7-billing-boleto-checkout__fact s7-billing-boleto-checkout__fact--highlight">
                <dt>Valor</dt>
                <dd>{formatPlanPriceBRL(view.value)}</dd>
              </div>
              {dueDateLabel ? (
                <div className="s7-billing-boleto-checkout__fact">
                  <dt>Vencimento</dt>
                  <dd>{dueDateLabel}</dd>
                </div>
              ) : null}
            </dl>
          </aside>

          <section className="s7-billing-boleto-checkout__payment-col" aria-label="Boleto e instruções">
            <div className="s7-billing-boleto-checkout__action-card">
              <div className="s7-billing-boleto-checkout__visual" aria-hidden="true">
                <svg className="s7-billing-boleto-checkout__barcode" viewBox="0 0 192 56" focusable="false">
                  <rect x="4" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="10" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="14" y="8" width="4" height="40" fill="currentColor" />
                  <rect x="22" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="28" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="34" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="38" y="8" width="5" height="40" fill="currentColor" />
                  <rect x="46" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="52" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="58" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="62" y="8" width="4" height="40" fill="currentColor" />
                  <rect x="70" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="76" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="82" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="86" y="8" width="5" height="40" fill="currentColor" />
                  <rect x="94" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="100" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="106" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="110" y="8" width="4" height="40" fill="currentColor" />
                  <rect x="118" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="124" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="130" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="134" y="8" width="5" height="40" fill="currentColor" />
                  <rect x="142" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="148" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="154" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="158" y="8" width="4" height="40" fill="currentColor" />
                  <rect x="166" y="8" width="2" height="40" fill="currentColor" />
                  <rect x="172" y="8" width="3" height="40" fill="currentColor" />
                  <rect x="178" y="8" width="1.5" height="40" fill="currentColor" />
                  <rect x="182" y="8" width="6" height="40" fill="currentColor" />
                </svg>
                <p className="s7-billing-boleto-checkout__visual-caption s7-billing-muted">
                  {view.hasOfficialUrl ? "Boleto pronto para pagamento" : "Gerando link do boleto…"}
                </p>
              </div>

              {!view.hasOfficialUrl ? (
                <p className="s7-billing-boleto-checkout__warning" role="status">
                  O link do boleto ainda não está disponível. Aguarde alguns instantes e tente novamente.
                </p>
              ) : null}

              <div className="s7-billing-boleto-checkout__actions">
                <S7Button variant="primary" onClick={downloadBoleto} disabled={!view.hasOfficialUrl}>
                  Baixar boleto
                </S7Button>
                <S7Button
                  variant="secondary"
                  onClick={handleCopyBoletoCode}
                  disabled={!view.providerPaymentId}
                  loading={copyLoading || codeLoading}
                >
                  {copied ? "Código copiado" : "Copiar código do boleto"}
                </S7Button>
              </div>
            </div>

            <ol className="s7-billing-boleto-checkout__steps">
              <li>Abra o app do seu banco ou internet banking.</li>
              <li>Escolha pagar boleto ou use o código copiado.</li>
              <li>A confirmação pode levar alguns dias úteis após o pagamento.</li>
            </ol>
          </section>

          <p className="s7-billing-boleto-checkout__footer">
            Boleto gerado com sucesso. A confirmação do pagamento libera o acesso automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

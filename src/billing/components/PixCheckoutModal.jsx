import { useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import pixLogo from "../../assets/billing/pix-logo.png";
import suse7Logo from "../../assets/suse7-logo-redonda.png";
import {
  pickCheckoutPixCopy,
  pickCheckoutPixQrImage,
  pickCheckoutProviderPaymentId,
} from "../checkoutUi";
import { formatPaymentDueDatePt, formatPlanDisplayName, formatPlanPriceBRL } from "../billingFormatters";
import { fetchBillingPixQr } from "../services/billingApi";
import "./PixCheckoutModal.css";

/**
 * @param {{
 *   open: boolean;
 *   checkout: Record<string, unknown> | null;
 *   planName: string;
 *   onClose: () => void;
 *   onPaymentConfirmed?: () => void | Promise<void>;
 * }} props
 */
export default function PixCheckoutModal({ open, checkout, planName, onClose }) {
  const { addNotification } = useNotifications();
  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [fetchedPixCopy, setFetchedPixCopy] = useState(null);
  const [copied, setCopied] = useState(false);

  const pixCopy = useMemo(() => pickCheckoutPixCopy(checkout), [checkout]);
  const effectivePixCopy = pixCopy || fetchedPixCopy;
  const providerPaymentId = useMemo(() => pickCheckoutProviderPaymentId(checkout), [checkout]);
  const initialQr = useMemo(() => pickCheckoutPixQrImage(checkout), [checkout]);

  const payment = checkout?.payment && typeof checkout.payment === "object" ? checkout.payment : null;
  const value = payment?.value ?? checkout?.plan?.price_monthly;
  const dueDate = payment?.due_date ?? null;
  const dueDateLabel = useMemo(() => formatPaymentDueDatePt(dueDate), [dueDate]);
  const displayPlanName = useMemo(
    () => formatPlanDisplayName(planName || payment?.plan_name || checkout?.plan?.name),
    [planName, payment?.plan_name, checkout?.plan?.name]
  );

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setFetchedPixCopy(null);

    if (initialQr) {
      setQrImage(initialQr);
    } else {
      setQrImage(null);
    }

    if (!providerPaymentId) return;

    const hasCopyFromCheckout = Boolean(pixCopy);
    if (initialQr && hasCopyFromCheckout) return;

    let active = true;
    setQrLoading(!initialQr);
    (async () => {
      const res = await fetchBillingPixQr({ provider_payment_id: providerPaymentId });
      if (!active) return;
      setQrLoading(false);
      if (res.ok && res.data?.pix) {
        const pix = res.data.pix;
        const img = pix.qr_code_image;
        if (!initialQr && typeof img === "string" && img.trim() !== "") {
          const trimmed = img.trim();
          setQrImage(trimmed.startsWith("data:") ? trimmed : `data:image/png;base64,${trimmed}`);
        }
        const copy =
          typeof pix.copy_paste_code === "string" && pix.copy_paste_code.trim() !== ""
            ? pix.copy_paste_code.trim()
            : null;
        if (copy) setFetchedPixCopy(copy);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, initialQr, providerPaymentId, pixCopy]);

  if (!open) return null;

  async function handleCopy() {
    if (!effectivePixCopy) {
      addNotification({
        event_type: "BILLING_PIX_COPY_ERROR",
        entity_type: "billing",
        title: "Código indisponível",
        message: "Aguarde alguns instantes e tente novamente.",
        severity: "warning",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(effectivePixCopy);
      setCopied(true);
      addNotification({
        event_type: "BILLING_PIX_COPIED",
        entity_type: "billing",
        title: "Código Pix copiado",
        message: "Cole no app do seu banco para concluir o pagamento.",
        severity: "success",
      });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      addNotification({
        event_type: "BILLING_PIX_COPY_ERROR",
        entity_type: "billing",
        title: "Não foi possível copiar",
        message: "Copie manualmente o código abaixo.",
        severity: "error",
      });
    }
  }

  return (
    <div
      className="s7-billing-checkout-sheet s7-billing-pix-checkout-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s7-pix-checkout-title"
      onClick={onClose}
    >
      <div
        className="s7-billing-checkout-sheet__panel s7-billing-pix-checkout"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="s7-billing-pix-checkout__layout">
          <aside className="s7-billing-pix-checkout__summary-col" aria-label="Resumo do pagamento">
            <header className="s7-billing-pix-checkout__summary-header">
              <div className="s7-billing-pix-checkout__brand-stack">
                <img
                  className="s7-billing-pix-checkout__suse7-logo"
                  src={suse7Logo}
                  alt="Suse7"
                  width={72}
                  height={72}
                  decoding="async"
                />
                <img className="s7-billing-pix-checkout__pix-logo" src={pixLogo} alt="" decoding="async" />
              </div>
              <h3 id="s7-pix-checkout-title" className="s7-billing-pix-checkout__title">
                Pagamento Pix
              </h3>
              <p className="s7-billing-pix-checkout__status">Aguardando pagamento</p>
            </header>

            <dl className="s7-billing-pix-checkout__facts">
              <div className="s7-billing-pix-checkout__fact s7-billing-pix-checkout__fact--highlight">
                <dt>Plano</dt>
                <dd>{displayPlanName}</dd>
              </div>
              <div className="s7-billing-pix-checkout__fact s7-billing-pix-checkout__fact--highlight">
                <dt>Valor</dt>
                <dd>{formatPlanPriceBRL(value)}</dd>
              </div>
              {dueDateLabel ? (
                <div className="s7-billing-pix-checkout__fact">
                  <dt>Vencimento</dt>
                  <dd>{dueDateLabel}</dd>
                </div>
              ) : null}
            </dl>
          </aside>

          <section className="s7-billing-pix-checkout__payment-col" aria-label="QR Code e instruções">
            <div className="s7-billing-pix-checkout__qr-card">
              <div className="s7-billing-pix-checkout__qr">
                {qrLoading ? (
                  <p className="s7-billing-pix-checkout__qr-placeholder s7-billing-muted">Gerando QR Code…</p>
                ) : null}
                {!qrLoading && qrImage ? (
                  <img src={qrImage} alt="QR Code para pagamento Pix" className="s7-billing-pix-checkout__qr-image" />
                ) : null}
                {!qrLoading && !qrImage ? (
                  <p className="s7-billing-pix-checkout__qr-placeholder s7-billing-muted">
                    QR Code indisponível. Use o Pix copia e cola.
                  </p>
                ) : null}
              </div>

              <div className="s7-billing-pix-checkout__actions">
                <S7Button variant="primary" onClick={handleCopy} disabled={!effectivePixCopy} loading={qrLoading}>
                  {copied ? "Código copiado" : "Copiar código Pix"}
                </S7Button>
              </div>
            </div>

            <ol className="s7-billing-pix-checkout__steps">
              <li>Abra o app do seu banco.</li>
              <li>Escolha Pix.</li>
              <li>Escaneie o QR Code ou use Pix copia e cola.</li>
            </ol>
          </section>

          <p className="s7-billing-pix-checkout__security">
            Pix gerado com sucesso. A confirmação do pagamento libera o acesso automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { S7Button, S7PageHeader } from "../../components/ui";
import { pickCheckoutInvoiceUrl, pickCheckoutPixCopy } from "../checkoutUi";
import { startBillingCheckout } from "../services/billingApi";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import "../billing.css";

/**
 * Deep link legado — não cria cobrança automaticamente ao montar.
 * O seller precisa confirmar explicitamente.
 */
export default function CheckoutRedirectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);

  const planSlug = params.get("plan_slug") || params.get("plan_key") || "";
  const paymentMethod = params.get("payment_method") || "PIX";

  const paymentUrl = useMemo(() => pickCheckoutInvoiceUrl(checkout), [checkout]);
  const pixCopy = useMemo(() => pickCheckoutPixCopy(checkout), [checkout]);

  async function handleConfirmCheckout() {
    if (!planSlug || loading) return;
    setError("");
    setLoading(true);
    const res = await startBillingCheckout({
      plan_slug: planSlug,
      payment_method: paymentMethod,
      explicit_user_action: true,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || res.data?.message || "Falha ao iniciar checkout.");
      return;
    }
    setCheckout(res.data);
    await refresh();
    const url = pickCheckoutInvoiceUrl(res.data);
    if (url) window.location.assign(url);
  }

  return (
    <div className="s7-billing-page">
      <S7PageHeader
        title="Checkout"
        subtitle="Confirme para gerar o pagamento. Nenhuma cobrança é criada automaticamente ao abrir esta página."
      />

      {!planSlug ? <p className="s7-billing-error">Plano não informado.</p> : null}

      {planSlug && !checkout ? (
        <section className="s7-billing-checkout-result">
          <p>
            Plano <strong>{planSlug}</strong> · método <strong>{paymentMethod}</strong>
          </p>
          <p className="s7-billing-muted">Clique em continuar apenas se você deseja gerar a cobrança agora.</p>
          <div className="s7-billing-page__actions">
            <S7Button variant="primary" onClick={handleConfirmCheckout} loading={loading} disabled={loading}>
              {loading ? "Gerando pagamento…" : "Gerar pagamento"}
            </S7Button>
            <S7Button variant="secondary" onClick={() => navigate("/perfil/assinatura/planos")} disabled={loading}>
              Voltar aos planos
            </S7Button>
          </div>
        </section>
      ) : null}

      {error ? <p className="s7-billing-error">{error}</p> : null}

      {checkout ? (
        <section className="s7-billing-checkout-result">
          {checkout?.kind === "internal_free" ? (
            <p>Plano gratuito ativado. Você já pode usar o Suse7 com o novo plano.</p>
          ) : (
            <p>Checkout criado. Aguardando confirmação do pagamento via webhook Asaas.</p>
          )}
          {paymentUrl ? (
            <p>
              Se o redirecionamento não abrir automaticamente,{" "}
              <a href={paymentUrl} target="_blank" rel="noreferrer">
                clique aqui para pagar
              </a>
              .
            </p>
          ) : null}
          {pixCopy ? (
            <label className="s7-billing-field">
              PIX copia e cola
              <textarea readOnly value={pixCopy} rows={4} />
            </label>
          ) : null}
        </section>
      ) : null}

      <div className="s7-billing-page__actions">
        <Link to="/perfil/assinatura/minha-assinatura">
          <S7Button variant="primary">Ir para minha assinatura</S7Button>
        </Link>
      </div>
    </div>
  );
}

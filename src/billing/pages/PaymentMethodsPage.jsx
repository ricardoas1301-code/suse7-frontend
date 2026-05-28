import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { S7Button, S7PageHeader } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import CardCheckoutModal from "../components/CardCheckoutModal";
import PaymentMethodCard from "../components/PaymentMethodCard";
import PaymentMethodEmptyState from "../components/PaymentMethodEmptyState";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { buildPaymentMethodPreviewSamples } from "../paymentMethodUi";
import { createCardPaymentMethod } from "../services/billingApi";
import { resolveBillingCardErrorMessage } from "../billingCheckoutErrors";
import "../billing.css";

export default function PaymentMethodsPage() {
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const { loading, error, methods, refresh } = usePaymentMethods();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const previewEnabled = import.meta.env.DEV && searchParams.get("preview") === "payment-methods";
  const displayedMethods = useMemo(() => {
    if (methods.length > 0) return methods;
    if (previewEnabled) return buildPaymentMethodPreviewSamples();
    return methods;
  }, [methods, previewEnabled]);

  async function handleSaveCard(cardPayload) {
    setSaveLoading(true);
    setSaveError(null);

    const body = cardPayload.card && typeof cardPayload.card === "object" ? cardPayload.card : null;
    if (!body) {
      setSaveLoading(false);
      setSaveError("Preencha os dados do cartão.");
      return;
    }

    const res = await createCardPaymentMethod({
      holder_name: body.holder_name,
      card_number: body.card_number,
      expiry_month: body.expiry_month,
      expiry_year: body.expiry_year,
      cvv: body.cvv,
      cpf_cnpj: body.cpf_cnpj,
      card_type: "credit",
      set_default: body.set_default,
    });

    setSaveLoading(false);

    if (!res.ok) {
      setSaveError(resolveBillingCardErrorMessage(res, "Não foi possível salvar o cartão."));
      return;
    }

    setAddModalOpen(false);
    await refresh();
    addNotification({
      event_type: "BILLING_CARD_SAVED",
      entity_type: "billing",
      title: "Cartão salvo",
      message: "Sua forma de pagamento foi cadastrada com sucesso.",
      severity: "success",
    });
  }

  return (
    <div className="s7-billing-page">
      <S7PageHeader
        title="Formas de pagamento"
        subtitle="Gerencie métodos salvos para upgrades, renovações e retentativas de cobrança com segurança."
        actions={
          <S7Button variant="secondary" onClick={() => refresh()} loading={loading}>
            Atualizar
          </S7Button>
        }
      />

      {loading ? <p className="s7-billing-muted">Carregando formas de pagamento…</p> : null}
      {error ? (
        <section className="s7-billing-page__state s7-billing-page__state--error" aria-live="polite">
          <p className="s7-billing-error">{error}</p>
          <S7Button variant="secondary" onClick={() => refresh()}>
            Tentar novamente
          </S7Button>
        </section>
      ) : null}

      {!loading && !error && displayedMethods.length === 0 ? (
        <PaymentMethodEmptyState onAdd={() => setAddModalOpen(true)} />
      ) : null}

      {!loading && !error && displayedMethods.length > 0 ? (
        <>
          <div className="s7-billing-payment-list__toolbar">
            <S7Button variant="primary" onClick={() => setAddModalOpen(true)}>
              Adicionar forma de pagamento
            </S7Button>
          </div>
          <section className="s7-billing-payment-list" aria-label="Formas de pagamento cadastradas">
            {displayedMethods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} onChanged={() => refresh()} preview={previewEnabled} />
            ))}
          </section>
        </>
      ) : null}

      <CardCheckoutModal
        open={addModalOpen}
        mode="save"
        savedMethods={methods}
        loading={saveLoading}
        errorMessage={saveError}
        onClose={() => {
          if (!saveLoading) {
            setAddModalOpen(false);
            setSaveError(null);
          }
        }}
        onSubmit={handleSaveCard}
      />
    </div>
  );
}

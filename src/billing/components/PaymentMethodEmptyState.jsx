import { CreditCard } from "lucide-react";
import { S7Button } from "../../components/ui";

export default function PaymentMethodEmptyState({ onAdd, loading = false }) {
  return (
    <section className="s7-billing-payment-empty" aria-label="Nenhuma forma de pagamento cadastrada">
      <div className="s7-billing-payment-empty__icon">
        <CreditCard size={28} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h2>Nenhuma forma de pagamento cadastrada</h2>
      <p>Adicione um método para facilitar upgrades e renovações automáticas.</p>
      <S7Button variant="primary" onClick={onAdd} loading={loading}>
        Adicionar forma de pagamento
      </S7Button>
    </section>
  );
}

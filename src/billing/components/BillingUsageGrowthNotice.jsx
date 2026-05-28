import { Link } from "react-router-dom";
import { S7Button } from "../../components/ui";

const COPY = {
  title: "Sua operação está crescendo 🚀",
  message:
    "Parabéns! Seu volume de vendas ultrapassou o limite do plano atual. Para acompanhar esse crescimento com segurança, o Suse7 manterá seu acesso por mais 30 dias. Se sua operação continuar acima desse volume ao final desse período, vamos recomendar o plano ideal para o seu momento.",
};

/**
 * @param {{ onDismiss?: () => void }} props
 */
export default function BillingUsageGrowthNotice({ onDismiss }) {
  return (
    <section className="s7-billing-growth-notice" aria-live="polite">
      <strong>{COPY.title}</strong>
      <p>{COPY.message}</p>
      <div className="s7-billing-growth-notice__actions">
        <S7Button variant="secondary" size="sm" onClick={onDismiss}>
          Entendi
        </S7Button>
        <Link to="/perfil/assinatura/planos">
          <S7Button variant="primary" size="sm">
            Ver planos
          </S7Button>
        </Link>
      </div>
    </section>
  );
}

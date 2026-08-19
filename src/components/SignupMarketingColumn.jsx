import { Link } from "react-router-dom";

import { SIGNUP_PLANS_CANONICAL_PATH } from "../billing/plansCatalogPaths.js";

export { SIGNUP_PLANS_CANONICAL_PATH };

/**
 * @param {{ children: import("react").ReactNode; className?: string }} props
 */
function SignupPlansLink({ children, className = "signup-plans-link" }) {
  return (
    <Link to={SIGNUP_PLANS_CANONICAL_PATH} className={className}>
      {children}
    </Link>
  );
}
export default function SignupMarketingColumn() {
  return (
    <div className="signup-left">
      <div className="signup-left__content">
        <section className="signup-marketing-hero" aria-labelledby="signup-marketing-title">
          <h1 id="signup-marketing-title" className="signup-main-title">
            Comece agora o seu <span className="signup-main-title__highlight">Teste Grátis</span>
          </h1>

          <p className="signup-lead">
            Conheça o poder do SUSE7 para organizar sua operação, proteger sua margem e vender com mais segurança.
          </p>

          <p className="signup-free-tier">
            Comece sem cartão, sem fidelidade. Cancele seu plano a qualquer momento. Depois do teste, você pode
            continuar no plano gratuito ou escolher o plano ideal para o seu volume de vendas.
          </p>

          <SignupPlansLink>Conheça todos os planos →</SignupPlansLink>
        </section>

        <div className="signup-value-sections">
          <section className="signup-value-section" aria-labelledby="signup-value-opercao">
            <h2 id="signup-value-opercao" className="signup-value-section__title">
              📊 Toda a sua operação em um só lugar
            </h2>
            <p>
              Centralize <strong>vendas, anúncios, produtos, clientes e múltiplas contas</strong> em uma única
              plataforma.
            </p>
            <p>
              Acompanhe sua operação por conta, produto, anúncio e SKU sem depender de várias planilhas e sistemas
              diferentes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

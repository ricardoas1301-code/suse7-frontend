import { Link } from "react-router-dom";
import { S7Button } from "../../components/ui";

export default function UpgradeCTA({ title = "Desbloqueie recursos premium", description, to = "/perfil/assinatura/planos" }) {
  return (
    <div className="s7-billing-upgrade-cta">
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      <Link to={to} className="s7-billing-upgrade-cta__link">
        <S7Button variant="primary">Ver planos</S7Button>
      </Link>
    </div>
  );
}

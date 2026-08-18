import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { resolveLegacyPopupCategorySlug } from "../../constants/notificationCenterSections";

/** Compatibilidade: /alertas-pop-up/:category → categoria unificada */
export default function AlertasPopupLegacyRedirect() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const slug = resolveLegacyPopupCategorySlug(category);

  const event =
    searchParams.get("event") ??
    searchParams.get("highlight") ??
    searchParams.get("type");
  const query = event ? `?event=${encodeURIComponent(event)}` : "";

  if (slug) {
    return <Navigate to={`/perfil/preferencias/notificacoes/${slug}${query}`} replace />;
  }

  return <Navigate to="/perfil/preferencias/notificacoes/vendas" replace />;
}

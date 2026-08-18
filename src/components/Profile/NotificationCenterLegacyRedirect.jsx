import { Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  resolveLegacyNotificationCategorySlug,
  resolveLegacyNotificationFocusSlug,
} from "../../constants/notificationCenterSections";

/** Compatibilidade: hub antigo, ?tab=, ?focus= e /notificacoes/:category */
export default function NotificationCenterLegacyRedirect() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();

  const tab = searchParams.get("tab");
  if (tab === "recipients") {
    return <Navigate to="/perfil/preferencias/notificacoes/destinatarios" replace />;
  }

  const focus = searchParams.get("focus");
  const focusSlug = resolveLegacyNotificationFocusSlug(focus);
  const categorySlug = resolveLegacyNotificationCategorySlug(category);
  const slug = focusSlug ?? categorySlug;

  const event =
    searchParams.get("event") ??
    searchParams.get("highlight") ??
    searchParams.get("type");
  const query = event ? `?event=${encodeURIComponent(event)}` : "";

  if (slug) {
    return <Navigate to={`/perfil/preferencias/notificacoes/${slug}${query}`} replace />;
  }

  return <Navigate to="/perfil/preferencias/notificacoes/destinatarios" replace />;
}

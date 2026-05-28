import { Navigate, useParams } from "react-router-dom";

/** Redireciona rotas legadas /notificacoes/:category para a Central unificada. */
export default function LegacyNotificacoesRedirect() {
  const { category } = useParams();
  const focus = category ? `?focus=${encodeURIComponent(category)}` : "";
  return <Navigate to={`/perfil/preferencias/notificacoes${focus}`} replace />;
}

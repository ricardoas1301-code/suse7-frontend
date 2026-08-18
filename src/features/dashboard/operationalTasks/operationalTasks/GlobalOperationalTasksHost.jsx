import { useLocation } from "react-router-dom";
import DashboardOperationalTasks from "./DashboardOperationalTasks.jsx";
import { useOperationalTasksBottomSafeArea } from "./useOperationalTasksBottomSafeArea.js";

/**
 * Host global — única montagem da Central de Pendências no shell autenticado (Layout).
 * Visibilidade real obedece gates 6/6 + pendências no painel.
 */
export default function GlobalOperationalTasksHost() {
  useOperationalTasksBottomSafeArea(true);
  return <DashboardOperationalTasks visible={true} />;
}

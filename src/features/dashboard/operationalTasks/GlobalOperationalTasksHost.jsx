import { useLocation } from "react-router-dom";
import DashboardOperationalTasks from "./DashboardOperationalTasks.jsx";
import { useOperationalTasksBottomSafeArea } from "./useOperationalTasksBottomSafeArea.js";

/**
 * Host global — única montagem da Central de Pendências no shell autenticado (Layout).
 * Lote 1: visibilidade operacional com snapshot de configuração inerte (sem UI Lote 2).
 */
export default function GlobalOperationalTasksHost() {
  useOperationalTasksBottomSafeArea(true);
  return <DashboardOperationalTasks visible={true} />;
}

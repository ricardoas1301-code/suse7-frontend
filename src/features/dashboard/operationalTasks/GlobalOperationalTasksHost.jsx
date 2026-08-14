import { useLocation } from "react-router-dom";
import DashboardOperationalTasks from "./DashboardOperationalTasks.jsx";
import { shouldShowOperationalTasks } from "./operationalTasksRoutes.js";
import { useOperationalTasksBottomSafeArea } from "./useOperationalTasksBottomSafeArea.js";

/**
 * Host global — única montagem da Central de Pendências no shell autenticado.
 * Preserva cache, estado e modal entre rotas habilitadas.
 */
export default function GlobalOperationalTasksHost() {
  const { pathname } = useLocation();
  const visible = shouldShowOperationalTasks(pathname);

  useOperationalTasksBottomSafeArea(visible);

  return <DashboardOperationalTasks visible={visible} />;
}

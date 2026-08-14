import { useCallback, useEffect, useRef, useState } from "react";
import BulkProductCostsModal from "../../products/costs/BulkProductCostsModal.jsx";
import BulkListingSkuModal from "../../listings/components/BulkListingSkuModal.jsx";
import { useConfigurationSnapshot } from "../configurationOnboarding/useConfigurationSnapshot.js";
import S7OperationalTasksPanel from "./S7OperationalTasksPanel.jsx";
import { useOperationalTasks } from "./useOperationalTasks.js";
import { OPERATIONAL_TASK_ACTION_TYPES } from "./operationalTaskTypes.js";
import { subscribeOperationalTaskActions } from "./operationalTaskActionRequests.js";

/**
 * Central de Tarefas Operacionais — painel + modal canônico de custos em lote.
 * @param {{ visible?: boolean }} [props]
 */
export default function DashboardOperationalTasks({ visible = true }) {
  const configuration = useConfigurationSnapshot({ enabled: visible });
  const operational = useOperationalTasks({ enabled: visible });
  const {
    tasks,
    totalTasks,
    initialLoading,
    refreshing,
    hasResolvedOnce,
    error: operationalError,
  } = operational;
  const [bulkCostsOpen, setBulkCostsOpen] = useState(false);
  const [bulkListingSkusOpen, setBulkListingSkusOpen] = useState(false);
  const [showResolvedCelebration, setShowResolvedCelebration] = useState(false);

  const hadPendingRef = useRef(false);
  useEffect(() => {
    if (initialLoading || refreshing) return;

    const hasPending = tasks.length > 0;
    if (hasPending) {
      hadPendingRef.current = true;
      // Oculta a celebração anterior assim que uma nova pendência chega.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowResolvedCelebration(false);
      return;
    }

    if (
      hadPendingRef.current &&
      hasResolvedOnce &&
      !initialLoading &&
      !refreshing
    ) {
      setShowResolvedCelebration(true);
      hadPendingRef.current = false;
    }
  }, [tasks.length, initialLoading, refreshing, hasResolvedOnce]);

  const handleTaskAction = useCallback((actionType) => {
    if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_LISTING_SKUS) {
      setBulkListingSkusOpen(true);
      return;
    }
    if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_PRODUCT_COSTS) {
      setBulkCostsOpen(true);
    }
  }, []);

  useEffect(
    () => subscribeOperationalTaskActions(handleTaskAction),
    [handleTaskAction],
  );

  const handleBulkSaved = useCallback((/** @type {{ remainingCount?: number }} */ payload) => {
    void payload;
  }, []);

  const handleBulkClose = useCallback(() => {
    setBulkCostsOpen(false);
  }, []);

  const handleConfigurationRetry = useCallback(() => {
    void configuration.refetch({ force: true });
  }, [configuration]);

  return (
    <>
      <S7OperationalTasksPanel
        visible={visible}
        configurationInitialLoading={configuration.initialLoading}
        configurationRefreshing={configuration.refreshing}
        configurationError={configuration.error}
        configurationHasResolvedOnce={configuration.hasResolvedOnce}
        configurationSnapshot={configuration.snapshot}
        onConfigurationRetry={handleConfigurationRetry}
        tasks={tasks}
        totalTasks={totalTasks}
        initialLoading={initialLoading}
        refreshing={refreshing}
        operationalError={operationalError}
        hasResolvedOnce={hasResolvedOnce}
        showResolvedCelebration={showResolvedCelebration}
        onTaskAction={handleTaskAction}
      />

      <BulkProductCostsModal
        open={bulkCostsOpen}
        onClose={handleBulkClose}
        onSaved={handleBulkSaved}
      />
      <BulkListingSkuModal
        open={bulkListingSkusOpen}
        onClose={() => setBulkListingSkusOpen(false)}
        onSaved={handleBulkSaved}
      />
    </>
  );
}

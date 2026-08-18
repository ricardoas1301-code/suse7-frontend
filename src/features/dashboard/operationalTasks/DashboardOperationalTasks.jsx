import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BulkProductCostsModal from "../../products/costs/BulkProductCostsModal.jsx";
import BulkListingSkuModal from "../../listings/components/BulkListingSkuModal.jsx";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import S7OperationalTasksPanel from "./S7OperationalTasksPanel.jsx";
import { useOperationalTasks } from "./useOperationalTasks.js";
import { OPERATIONAL_TASK_ACTION_TYPES } from "./operationalTaskTypes.js";
import { subscribeOperationalTaskActions } from "./operationalTaskActionRequests.js";
import { useGlobalSellerCompanyModal } from "./globalSellerCompanyModalContext.jsx";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CONFIGURATION_SNAPSHOT_LOTE1_INERT = {
  configuration: { status: "COMPLETED", percent: 100, completed: 6, total: 6 },
  milestones: [],
};

export default function DashboardOperationalTasks({ visible = true }) {
  const navigate = useNavigate();
  const globalSellerCompanyModal = useGlobalSellerCompanyModal();
  const operational = useOperationalTasks({ enabled: visible });
  const {
    tasks,
    totalTasks,
    mlInitialSyncPhase,
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
      setShowResolvedCelebration(false);
      return;
    }
    if (hadPendingRef.current && hasResolvedOnce && !initialLoading && !refreshing) {
      setShowResolvedCelebration(true);
      hadPendingRef.current = false;
    }
  }, [tasks.length, initialLoading, refreshing, hasResolvedOnce]);

  const handleTaskAction = useCallback(
    async (actionType, task) => {
      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_LISTING_SKUS) {
        setBulkListingSkusOpen(true);
        return;
      }
      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_BULK_PRODUCT_COSTS) {
        setBulkCostsOpen(true);
        return;
      }
      const accountId =
        task?.marketplace_account_id != null ? String(task.marketplace_account_id).trim() : "";
      const accountQs =
        accountId && UUID_RE.test(accountId) ? encodeURIComponent(accountId) : "";
      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL && accountQs) {
        navigate(`/perfil/integracoes/mercado-livre?ml_post_connect=${accountQs}`);
        return;
      }
      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_SYNC_MODAL && accountQs) {
        navigate(`/perfil/integracoes/mercado-livre?ml_sync_modal=${accountQs}`);
        return;
      }
      if (
        actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_COMPANY_EDIT ||
        actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_PROFILE_AVATAR ||
        actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_PROFILE_CONTACT
      ) {
        const opened = await globalSellerCompanyModal?.openSellerCompanyModal?.({ company: "principal" });
        if (opened) return;
        navigate("/perfil/dados-empresa?editar=principal");
        return;
      }
    },
    [globalSellerCompanyModal, navigate],
  );

  useEffect(() => subscribeOperationalTaskActions(handleTaskAction), [handleTaskAction]);

  return (
    <>
      <S7OperationalTasksPanel
        visible={visible}
        configurationInitialLoading={false}
        configurationRefreshing={false}
        configurationError={null}
        configurationHasResolvedOnce={true}
        configurationSnapshot={CONFIGURATION_SNAPSHOT_LOTE1_INERT}
        tasks={tasks}
        totalTasks={totalTasks}
        initialLoading={initialLoading}
        refreshing={refreshing}
        operationalError={operationalError}
        hasResolvedOnce={hasResolvedOnce}
        mlInitialSyncPhase={mlInitialSyncPhase}
        showResolvedCelebration={showResolvedCelebration}
        configurationCompletionCelebrationActive={false}
        onTaskAction={handleTaskAction}
      />
      <BulkProductCostsModal open={bulkCostsOpen} onClose={() => setBulkCostsOpen(false)} onSaved={() => {}} />
      <BulkListingSkuModal
        open={bulkListingSkusOpen}
        onClose={() => setBulkListingSkusOpen(false)}
        onSaved={() => {}}
      />
    </>
  );
}

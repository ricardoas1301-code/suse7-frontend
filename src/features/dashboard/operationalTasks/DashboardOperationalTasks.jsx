import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import BulkProductCostsModal from "../../products/costs/BulkProductCostsModal.jsx";

import BulkListingSkuModal from "../../listings/components/BulkListingSkuModal.jsx";

import ConfigurationOnboardingActionsHost from "../configurationOnboarding/ConfigurationOnboardingActionsHost.jsx";

import { useConfigurationSnapshot } from "../configurationOnboarding/useConfigurationSnapshot.js";

import { configuracaoEstaCompleta } from "../configurationOnboarding/configurationOnboardingSelectors.js";

import {

  markConfigurationOAuthReturnCelebration,

  readConfigurationCompletionDismissed,

  writeConfigurationCompletionDismissed,

  hasConfigurationOAuthReturnCelebration,

} from "../configurationOnboarding/configurationOnboardingCompletionStorage.js";

import {

  reconciliarLatchesConfiguracaoInicial,

} from "../configurationOnboarding/configurationOnboardingMlConnectApi.js";

import { invalidateOperationalTasksCache } from "./operationalTasksApi.js";

import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";

import S7OperationalTasksPanel from "./S7OperationalTasksPanel.jsx";

import { useOperationalTasks } from "./useOperationalTasks.js";

import { OPERATIONAL_TASK_ACTION_TYPES } from "./operationalTaskTypes.js";

import { subscribeOperationalTaskActions } from "./operationalTaskActionRequests.js";

import { useGlobalSellerCompanyModal } from "./globalSellerCompanyModalContext.jsx";

import MarketplaceSyncDetailsHost from "./MarketplaceSyncDetailsHost.jsx";

import { resolveOperationalMarketplaceConnectRoute } from "./resolveOperationalMarketplaceConnectRoute.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;



/**

 * Central de Tarefas Operacionais — painel + modal canônico de custos em lote.

 * @param {{ visible?: boolean }} [props]

 */

export default function DashboardOperationalTasks({ visible = true }) {

  const configuration = useConfigurationSnapshot({ enabled: visible });

  const { user } = useAuthBootstrap();

  const userId = user?.id ?? null;

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const globalSellerCompanyModal = useGlobalSellerCompanyModal();

  const onboardingReturnHandledRef = useRef(false);

  /** Clique único: evita dois OAuths em double-click no CTA Reconectar. */
  const marketplaceConnectInFlightRef = useRef(false);

  const operational = useOperationalTasks({ enabled: visible });

  const {

    tasks,

    totalTasks,

    mlInitialSyncPhase,

    initialLoading,

    refreshing,

    hasResolvedOnce,

    error: operationalError,

    refetch: refetchOperationalTasks,

  } = operational;

  const [bulkCostsOpen, setBulkCostsOpen] = useState(false);

  const [syncDetailsHost, setSyncDetailsHost] = useState({ open: false, accountId: null, mode: "view" });

  const [bulkListingSkusOpen, setBulkListingSkusOpen] = useState(false);

  const [showResolvedCelebration, setShowResolvedCelebration] = useState(false);

  const [activeConfigurationMilestoneId, setActiveConfigurationMilestoneId] = useState(

    /** @type {string | null} */ (null),

  );

  const [completionDismissed, setCompletionDismissed] = useState(() =>

    readConfigurationCompletionDismissed(userId),

  );

  const [oauthReturnCelebration, setOauthReturnCelebration] = useState(() =>

    hasConfigurationOAuthReturnCelebration(userId),

  );



  useEffect(() => {

    setCompletionDismissed(readConfigurationCompletionDismissed(userId));

    setOauthReturnCelebration(hasConfigurationOAuthReturnCelebration(userId));

  }, [userId]);



  const configurationCompletionCelebrationActive = useMemo(() => {

    if (!configuration.hasResolvedOnce || configuration.initialLoading) return false;

    if (completionDismissed) return false;

    if (!oauthReturnCelebration) return false;

    return configuracaoEstaCompleta(configuration.snapshot);

  }, [

    completionDismissed,

    configuration.hasResolvedOnce,

    configuration.initialLoading,

    configuration.snapshot,

    oauthReturnCelebration,

  ]);



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



  const clearOAuthReturnQueryParams = useCallback(() => {

    setSearchParams(

      (prev) => {

        const next = new URLSearchParams(prev);

        for (const key of [

          "ml_onboarding",

          "marketplace_account_id",

          "ml_account",

          "ml",

          "connected",

          "ml_awaiting_sync",

          "jobs_created",

        ]) {

          next.delete(key);

        }

        return next;

      },

      { replace: true },

    );

  }, [setSearchParams]);



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



      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL && accountId && UUID_RE.test(accountId)) {
        setSyncDetailsHost({ open: true, accountId, mode: "start" });
        return;
      }

      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_SYNC_MODAL && accountId && UUID_RE.test(accountId)) {
        setSyncDetailsHost({ open: true, accountId, mode: "view" });
        return;
      }

      if (actionType === OPERATIONAL_TASK_ACTION_TYPES.OPEN_MARKETPLACE_CONNECT) {
        if (marketplaceConnectInFlightRef.current) return;
        const resolution = resolveOperationalMarketplaceConnectRoute(task);
        if (resolution.kind === "oauth_reconnect" && resolution.path) {
          marketplaceConnectInFlightRef.current = true;
          navigate(resolution.path);
          return;
        }
        if (resolution.kind === "missing_seller_company") {
          // Sem seller_company_id canônico: não inventar OAuth genérico nem duplicar conta.
          navigate(
            "/perfil/integracoes/mercado-livre?ml_error=seller_company_id_required_for_ml_connect",
          );
          return;
        }
        navigate(resolution.path || "/perfil/integracoes/mercado-livre");
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



  const handleBulkSaved = useCallback(() => {}, []);



  const handleBulkClose = useCallback(() => {

    setBulkCostsOpen(false);

  }, []);



  const handleConfigurationRetry = useCallback(() => {

    void configuration.refetch({ force: true });

  }, [configuration]);



  const handleConfigurationMilestoneAction = useCallback((milestoneId) => {

    setActiveConfigurationMilestoneId(String(milestoneId ?? "").trim() || null);

  }, []);



  const handleConfigurationActionClose = useCallback(() => {

    setActiveConfigurationMilestoneId(null);

  }, []);



  const handleConfigurationRefreshAfterWrite = useCallback(async () => {

    const res = await configuration.refresh();

    if (!res?.ok) {

      return { ok: false, error: res?.error || "Não foi possível atualizar o progresso." };

    }

    return { ok: true };

  }, [configuration]);



  const handleDismissConfigurationCelebration = useCallback(() => {

    writeConfigurationCompletionDismissed(userId);

    setCompletionDismissed(true);

    setOauthReturnCelebration(false);

  }, [userId]);



  useEffect(() => {

    if (!visible || onboardingReturnHandledRef.current) return;



    const onboardingFlag = searchParams.get("ml_onboarding");

    const mlConnected =

      searchParams.get("ml") === "connected" || searchParams.get("connected") === "1";

    const accountRaw =

      searchParams.get("marketplace_account_id")?.trim() ||

      searchParams.get("ml_account")?.trim() ||

      "";

    const isOAuthReturn =

      onboardingFlag === "connected" || (mlConnected && accountRaw && UUID_RE.test(accountRaw));



    if (!isOAuthReturn) return;



    onboardingReturnHandledRef.current = true;

    markConfigurationOAuthReturnCelebration(userId);

    setOauthReturnCelebration(true);



    (async () => {

      await reconciliarLatchesConfiguracaoInicial().catch(() => null);

      await configuration.refresh({ force: true });

      invalidateOperationalTasksCache({ reason: "oauth_return" });

      await refetchOperationalTasks({ force: true }).catch(() => null);

      clearOAuthReturnQueryParams();

    })();

  }, [

    visible,

    searchParams,

    configuration,

    userId,

    clearOAuthReturnQueryParams,

    refetchOperationalTasks,

  ]);



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

        onConfigurationMilestoneAction={handleConfigurationMilestoneAction}

        configurationCompletionCelebrationActive={configurationCompletionCelebrationActive}

        onDismissConfigurationCelebration={handleDismissConfigurationCelebration}

        tasks={tasks}

        totalTasks={totalTasks}

        initialLoading={initialLoading}

        refreshing={refreshing}

        operationalError={operationalError}

        hasResolvedOnce={hasResolvedOnce}

        mlInitialSyncPhase={mlInitialSyncPhase}

        showResolvedCelebration={showResolvedCelebration}

        onTaskAction={handleTaskAction}

      />



      {syncDetailsHost.open ? (
        <MarketplaceSyncDetailsHost
          open={syncDetailsHost.open}
          marketplaceAccountId={syncDetailsHost.accountId}
          mode={syncDetailsHost.mode}
          onClose={() => setSyncDetailsHost({ open: false, accountId: null, mode: "view" })}
        />
      ) : null}

      <BulkProductCostsModal open={bulkCostsOpen} onClose={handleBulkClose} onSaved={handleBulkSaved} />

      <BulkListingSkuModal

        open={bulkListingSkusOpen}

        onClose={() => setBulkListingSkusOpen(false)}

        onSaved={handleBulkSaved}

      />



      <ConfigurationOnboardingActionsHost

        snapshot={configuration.snapshot}

        activeMilestoneId={activeConfigurationMilestoneId}

        onClose={handleConfigurationActionClose}

        onRefreshSnapshot={handleConfigurationRefreshAfterWrite}

      />

    </>

  );

}



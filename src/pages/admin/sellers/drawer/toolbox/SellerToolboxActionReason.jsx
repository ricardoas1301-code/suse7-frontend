import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { S7Button } from "../../../../../components/ui";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  SELLER_TOOLBOX_QUICK_REASONS,
  SELLER_TOOLBOX_REASON_MAX_LENGTH,
} from "./sellerToolboxActionReasonModel";
import { executeSubscriptionOperation } from "./subscription/sellerToolboxSubscriptionOperationExecutor";
import {
  getSellerToolboxSubscriptionOperationConfig,
  getSellerToolboxSubscriptionOperationQuickReasons,
  isSellerToolboxSubscriptionOperationActionId,
  SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_QUICK_REASON_KEYS,
} from "./subscription/sellerToolboxSubscriptionOperationModel";
import { useSellerToolboxActionReason } from "./useSellerToolboxActionReason";
import { useSellerToolboxFeedback } from "./useSellerToolboxFeedback";
import { useSellerToolboxOperationalLog } from "./useSellerToolboxOperationalLog";
import { useSellerToolboxTrialStatus } from "./useSellerToolboxTrialStatus";
import { useSellerConsumptionView } from "./subscription/useSellerConsumptionView";
import { useSellerFeatureFlagsView } from "./featureFlags/useSellerFeatureFlagsView";
import { useSellerCacheRefreshView } from "./cacheRefresh/useSellerCacheRefreshView";
import { useSalesSyncView } from "./centralSync/sales/useSalesSyncView";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "./sellerToolboxOperationalLog";
import "./SellerToolboxActionReason.css";

function SellerToolboxActionReasonOverlay() {
  const { sellerId } = useSellerToolbox();
  const {
    reasonState,
    isReasonOpen,
    validationError,
    executingActionId,
    setExecutingActionId,
    setExecutingMetadata,
    setCompletedAction,
    setReason,
    applyQuickReason,
    validateReason,
    closeReason,
    clearReason,
  } = useSellerToolboxActionReason();
  const { showFeedback } = useSellerToolboxFeedback();
  const { logOperation } = useSellerToolboxOperationalLog();
  const { applyTrialStatusFromOperation } = useSellerToolboxTrialStatus();
  const { consumption, applyConsumptionOperationResult } = useSellerConsumptionView();
  const { applyFeatureFlagOperationResult } = useSellerFeatureFlagsView();
  const { lastRefreshedAt, refreshedScopes, applyRefreshResult, applyClearCacheResult, applyReloadPanelResult, lastClearedAt, clearedScopes, lastReloadedAt, reloadedPanels } = useSellerCacheRefreshView();
  const { sale, applySalesReimportResult, applySalesFinancialRecalculateResult, applySalesCustomerReprocessResult } = useSalesSyncView();
  const reasonRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const loggedOpenRef = useRef(false);

  const isExecuting = executingActionId != null;

  const quickReasons = useMemo(() => {
    const operationQuickReasons = getSellerToolboxSubscriptionOperationQuickReasons(reasonState?.actionId);
    if (operationQuickReasons.length > 0) return operationQuickReasons;

    if (isSellerToolboxSubscriptionOperationActionId(reasonState?.actionId)) {
      return SELLER_TOOLBOX_QUICK_REASONS.filter((preset) =>
        SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_QUICK_REASON_KEYS.has(preset.key),
      );
    }
    return SELLER_TOOLBOX_QUICK_REASONS;
  }, [reasonState?.actionId]);

  const confirmButtonLabel = useMemo(() => {
    if (isExecuting) return "Processando...";
    if (isSellerToolboxSubscriptionOperationActionId(reasonState?.actionId)) {
      return "Confirmar";
    }
    return "Confirmar (fake)";
  }, [isExecuting, reasonState?.actionId]);

  useEffect(() => {
    if (!isReasonOpen || !reasonState) {
      loggedOpenRef.current = false;
      return;
    }

    if (!loggedOpenRef.current) {
      loggedOpenRef.current = true;
      logSellerToolbox("reason_open", {
        sellerId,
        actionId: reasonState.actionId,
      });
    }

    reasonRef.current?.focus();
  }, [isReasonOpen, reasonState, sellerId]);

  const handleCancel = useCallback(() => {
    if (isExecuting) return;
    closeReason();
  }, [closeReason, isExecuting]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        if (isExecuting) return;
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [handleCancel, isExecuting],
  );

  const runGenericFakeConfirm = useCallback(
    (reasonLength, reasonCategory, actionId) => {
      logSellerToolbox("reason_confirmed_fake", {
        sellerId,
        actionId,
        reasonLength,
      });

      logOperation({
        event: "reason_confirmed_fake",
        category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
        metadata: {
          actionId,
          reasonLength,
          reasonCategory,
        },
      });

      showFeedback({
        type: "success",
        title: "Ação simulada registrada",
        description: "Motivo validado — nenhuma operação real foi executada nesta fase.",
      });

      clearReason();
    },
    [sellerId, logOperation, showFeedback, clearReason],
  );

  const runSubscriptionOperation = useCallback(
    async (actionId, reason, operationMetadata) => {
      const config = getSellerToolboxSubscriptionOperationConfig(actionId);
      if (!config) return;

      const reasonLength = reason.length;

      setExecutingActionId(actionId);
      setExecutingMetadata(operationMetadata ?? null);

      try {
        const handlerContext =
          config.buildHandlerContext?.({
            consumption,
            cacheRefresh: {
              lastRefreshedAt,
              refreshedScopes,
              lastClearedAt,
              clearedScopes,
              lastReloadedAt,
              reloadedPanels,
            },
            salesSync: { sale },
            metadata: operationMetadata ?? null,
          }) ?? {};

        await executeSubscriptionOperation({
          actionId,
          sellerId,
          reason,
          metadata: operationMetadata ?? null,
          execute: (context) => config.handler({ ...context, ...handlerContext }),
          onSuccess: (data) => {
            if (data.trialStatus === "active" || data.trialStatus === "ended") {
              applyTrialStatusFromOperation(data.trialStatus);
            }

            if (config.applyConsumptionResult) {
              applyConsumptionOperationResult(data);
            }

            if (config.applyFeatureFlagResult) {
              applyFeatureFlagOperationResult(data);
            }

            if (config.applyCacheRefreshResult) {
              applyRefreshResult(data);
            }

            if (config.applyCacheClearResult) {
              applyClearCacheResult(data);
            }

            if (config.applyCacheReloadResult) {
              applyReloadPanelResult(data);
            }

            if (config.applySalesReimportResult) {
              applySalesReimportResult(data);
            }

            if (config.applySalesFinancialRecalculateResult) {
              applySalesFinancialRecalculateResult(data);
            }

            if (config.applySalesCustomerReprocessResult) {
              applySalesCustomerReprocessResult(data);
            }

            logOperation({
              event: config.operationalLog.event,
              category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
              metadata: config.operationalLog.buildMetadata(
                data,
                reasonLength,
                actionId,
                operationMetadata ?? null,
              ),
            });

            setCompletedAction({
              actionId,
              status: "success",
              metadata: operationMetadata ?? undefined,
            });

            showFeedback({
              type: "success",
              title: config.feedback.success.title,
              description: config.feedback.success.description,
            });

            clearReason();
          },
          onError: () => {
            setCompletedAction({
              actionId,
              status: "error_fake",
              metadata: operationMetadata ?? undefined,
            });

            showFeedback({
              type: "error",
              title: config.feedback.error.title,
              description: config.feedback.error.description,
            });

            clearReason();
          },
        });
      } finally {
        setExecutingActionId(null);
        setExecutingMetadata(null);
      }
    },
    [
      sellerId,
      logOperation,
      showFeedback,
      clearReason,
      setExecutingActionId,
      setExecutingMetadata,
      setCompletedAction,
      applyTrialStatusFromOperation,
      consumption,
      applyConsumptionOperationResult,
      applyFeatureFlagOperationResult,
      applyRefreshResult,
      applyClearCacheResult,
      applyReloadPanelResult,
      lastRefreshedAt,
      refreshedScopes,
      lastClearedAt,
      clearedScopes,
      lastReloadedAt,
      reloadedPanels,
      sale,
      applySalesReimportResult,
      applySalesFinancialRecalculateResult,
      applySalesCustomerReprocessResult,
    ],
  );

  const handleConfirm = useCallback(() => {
    if (!reasonState || isExecuting) return;

    const isValid = validateReason();
    if (!isValid) {
      logSellerToolbox("reason_invalid", {
        sellerId,
        actionId: reasonState.actionId,
        reasonLength: reasonState.reason.length,
      });
      return;
    }

    const reasonLength = reasonState.reason.length;
    const reasonCategory = reasonState.reasonCategory ?? "unspecified";
    const { actionId, reason } = reasonState;

    if (isSellerToolboxSubscriptionOperationActionId(actionId)) {
      void runSubscriptionOperation(actionId, reason, reasonState.metadata);
      return;
    }

    runGenericFakeConfirm(reasonLength, reasonCategory, actionId);
  }, [
    reasonState,
    isExecuting,
    validateReason,
    sellerId,
    runSubscriptionOperation,
    runGenericFakeConfirm,
  ]);

  if (!isReasonOpen || !reasonState) return null;

  const reasonLength = reasonState.reason.length;

  return (
    <div className="seller-toolbox-reason" data-valid={reasonState.isValid || undefined}>
      <div
        className="seller-toolbox-reason__backdrop"
        aria-hidden
        onClick={isExecuting ? undefined : handleCancel}
      />
      <div
        className="seller-toolbox-reason__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-toolbox-reason-title"
        aria-describedby="seller-toolbox-reason-desc"
        onKeyDown={handleKeyDown}
        data-executing={isExecuting || undefined}
      >
        <header className="seller-toolbox-reason__head">
          <h4 id="seller-toolbox-reason-title" className="seller-toolbox-reason__title">
            Motivo da ação
          </h4>
          <p id="seller-toolbox-reason-desc" className="seller-toolbox-reason__subtitle">
            {reasonState.title}
          </p>
        </header>

        <p className="seller-toolbox-reason__message">{reasonState.description}</p>

        <div className="seller-toolbox-reason__quick">
          {quickReasons.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`seller-toolbox-reason__chip ${
                reasonState.reasonCategory === preset.key ? "seller-toolbox-reason__chip--active" : ""
              }`.trim()}
              disabled={isExecuting}
              onClick={() => applyQuickReason(preset.key, preset.prefix)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="seller-toolbox-reason__field">
          <span className="seller-toolbox-reason__label">Motivo operacional</span>
          <textarea
            ref={reasonRef}
            className="seller-toolbox-reason__input"
            value={reasonState.reason}
            rows={4}
            maxLength={SELLER_TOOLBOX_REASON_MAX_LENGTH}
            placeholder="Descreva o motivo desta ação..."
            disabled={isExecuting}
            onChange={(event) => setReason(event.target.value)}
          />
          <span className="seller-toolbox-reason__counter">
            {reasonLength}/{SELLER_TOOLBOX_REASON_MAX_LENGTH}
          </span>
        </label>

        {validationError ? (
          <p className="seller-toolbox-reason__error" role="alert">
            {validationError}
          </p>
        ) : null}

        <footer className="seller-toolbox-reason__actions">
          <button
            type="button"
            className="s7-btn s7-btn--secondary s7-btn--sm"
            disabled={isExecuting}
            onClick={handleCancel}
          >
            <span className="s7-btn__label">Cancelar</span>
          </button>
          <S7Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isExecuting}
            onClick={handleConfirm}
          >
            {confirmButtonLabel}
          </S7Button>
        </footer>
      </div>
    </div>
  );
}

export default memo(SellerToolboxActionReasonOverlay);

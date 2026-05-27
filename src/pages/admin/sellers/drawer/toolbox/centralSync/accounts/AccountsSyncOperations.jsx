import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../../useSellerToolboxConfirmAction";
import { isAnotherAccountsSyncFlowActive } from "./accountsSyncActionUtils";
import { ACCOUNTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS } from "./accountsSyncOperationModel";
import { SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID } from "./sellerToolboxValidateMarketplaceTokenOperation";
import { SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID } from "./sellerToolboxForceMarketplaceSyncOperation";
import { useAccountsSyncView } from "./useAccountsSyncView";
import "./AccountsSyncOperations.css";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 * }} props
 */
function AccountsSyncOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, account } = useAccountsSyncView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded" || !account;

  const operationState = useMemo(
    () =>
      resolveSubscriptionOperationState({
        actionId,
        isConfirmOpen,
        pendingActionId: pendingAction?.id,
        isReasonOpen,
        reasonActionId: reasonState?.actionId,
        executingActionId,
        completedAction,
      }),
    [
      actionId,
      isConfirmOpen,
      pendingAction?.id,
      isReasonOpen,
      reasonState?.actionId,
      executingActionId,
      completedAction,
    ],
  );

  const isThisFlowActive =
    operationState !== "idle" &&
    operationState !== "success" &&
    operationState !== "error_fake";

  const isAnotherFlowActive = isAnotherAccountsSyncFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    accountsSyncActionIds: ACCOUNTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
  });

  const isExecuting = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || !account) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        accountId: account.accountId,
        accountLabel: account.accountLabel,
        marketplace: account.marketplace,
        previousTokenStatus: account.tokenStatus,
        previousSyncStatus: account.syncStatus,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    account,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="accounts-sync-operations__btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="accounts-sync-operations__label">{isExecuting ? loadingLabel : label}</span>
      <span className="accounts-sync-operations__badge">DEV</span>
    </button>
  );
}

function AccountsSyncOperations() {
  const { account } = useAccountsSyncView();
  if (!account) return null;

  return (
    <section className="accounts-sync-operations" aria-label="Ações operacionais da conta marketplace">
      <header className="accounts-sync-operations__head">
        <h5 className="accounts-sync-operations__title">Ações operacionais</h5>
        <p className="accounts-sync-operations__desc">
          Validação de token e sincronização manual simuladas para esta conta.
        </p>
      </header>

      <div className="accounts-sync-operations__buttons">
        <AccountsSyncOperationButton
          actionId={SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID}
          label="Validar token DEV"
          loadingLabel="Validando..."
          confirmTitle="Validar token da conta?"
          confirmDescription="Esta ação vai simular a validação do token desta conta. Nenhuma integração real será consultada."
        />
        <AccountsSyncOperationButton
          actionId={SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID}
          label="Forçar sync DEV"
          loadingLabel="Sincronizando..."
          confirmTitle="Forçar sincronização da conta?"
          confirmDescription="Esta ação vai simular um sync manual desta conta. Nenhum dado real será importado."
        />
      </div>
    </section>
  );
}

export default memo(AccountsSyncOperations);

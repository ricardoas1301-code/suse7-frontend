import { devCenterExecutarOperacaoIntegracaoSeller } from "../../../../../../services/devCenterApi";

/**
 * @param {string} actionId
 */
export function createRealIntegrationOperationHandler(actionId) {
  /**
   * @param {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
   *   accountId?: string;
   *   accountLabel?: string;
   *   marketplace?: string;
   * }} context
   */
  return async function executeRealIntegrationOperation(context) {
    const sellerId = String(context.sellerId ?? "").trim();
    const reason = String(context.reason ?? "").trim();
    const accountId = String(context.accountId ?? "").trim();

    const response = await devCenterExecutarOperacaoIntegracaoSeller(sellerId, {
      actionId,
      reason,
      metadata: {
        accountId,
        accountLabel: context.accountLabel ?? null,
        marketplace: context.marketplace ?? null,
      },
    });

    if (!response.ok) {
      const message =
        response.data?.message ??
        response.error ??
        "Não foi possível concluir a operação de integração.";
      throw new Error(message);
    }

    const payload = response.data ?? {};
    const result = payload.result && typeof payload.result === "object" ? payload.result : {};

    return {
      ...result,
      auditId: payload.auditId ?? null,
      operationId: payload.operationId ?? actionId,
      operationStatus: payload.status ?? "success",
      marketplaceAccountId: payload.marketplaceAccountId ?? accountId,
    };
  };
}

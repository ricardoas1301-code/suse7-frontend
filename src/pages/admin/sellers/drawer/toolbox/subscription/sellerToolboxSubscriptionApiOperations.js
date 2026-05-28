import { devCenterExecutarOperacaoAssinaturaSeller } from "../../../../../../services/devCenterApi";

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {string} actionId
 */
export function createRealSubscriptionOperationHandler(actionId) {
  /**
   * @param {SellerToolboxSubscriptionOperationContext} context
   */
  return async function executeRealSubscriptionOperation(context) {
    const sellerId = String(context.sellerId ?? "").trim();
    const reason = String(context.reason ?? "").trim();

    const response = await devCenterExecutarOperacaoAssinaturaSeller(sellerId, {
      actionId,
      reason,
    });

    if (!response.ok) {
      const message =
        response.data?.message ??
        response.error ??
        "Não foi possível concluir a operação de assinatura.";
      throw new Error(message);
    }

    const payload = response.data ?? {};
    const result = payload.result && typeof payload.result === "object" ? payload.result : {};

    return {
      ...result,
      auditId: payload.auditId ?? null,
      operationId: payload.operationId ?? actionId,
      operationStatus: payload.status ?? "success",
    };
  };
}

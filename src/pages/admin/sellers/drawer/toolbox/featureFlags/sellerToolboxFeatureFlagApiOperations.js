import { devCenterExecutarOperacaoFeatureFlagSeller } from "../../../../../../services/devCenterApi";

/**
 * @param {string} actionId
 */
export function createRealFeatureFlagOperationHandler(actionId) {
  /**
   * @param {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
   *   flagKey?: string;
   *   flagLabel?: string;
   * }} context
   */
  return async function executeRealFeatureFlagOperation(context) {
    const sellerId = String(context.sellerId ?? "").trim();
    const reason = String(context.reason ?? "").trim();
    const flagKey = String(context.flagKey ?? "").trim();

    const response = await devCenterExecutarOperacaoFeatureFlagSeller(sellerId, {
      actionId,
      reason,
      metadata: {
        flagKey,
        flagLabel: context.flagLabel ?? null,
      },
    });

    if (!response.ok) {
      const message =
        response.data?.message ??
        response.error ??
        "Não foi possível concluir a operação de feature flag.";
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

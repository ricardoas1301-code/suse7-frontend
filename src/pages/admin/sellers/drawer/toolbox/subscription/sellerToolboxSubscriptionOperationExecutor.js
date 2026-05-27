import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { validateSellerToolboxReasonText } from "../sellerToolboxActionReasonModel";
import { getSellerToolboxSubscriptionOperationConfig } from "./sellerToolboxSubscriptionOperationModel";

/**
 * @typedef {{
 *   code: string;
 *   message: string;
 * }} SellerToolboxSubscriptionOperationError
 */

/**
 * @typedef {{
 *   success: true;
 *   data: Record<string, unknown>;
 *   error: null;
 * } | {
 *   success: false;
 *   data: null;
 *   error: SellerToolboxSubscriptionOperationError;
 * }} SellerToolboxSubscriptionOperationResult
 */

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {{
 *   actionId: string;
 *   sellerId: string;
 *   reason: string;
 *   metadata?: Record<string, unknown> | null;
 *   execute?: (context: SellerToolboxSubscriptionOperationContext) => Promise<Record<string, unknown>>;
 *   onSuccess?: (data: Record<string, unknown>) => void;
 *   onError?: (error: SellerToolboxSubscriptionOperationError) => void;
 * }} input
 * @returns {Promise<SellerToolboxSubscriptionOperationResult>}
 */
export async function executeSubscriptionOperation({
  actionId,
  sellerId,
  reason,
  metadata = null,
  execute,
  onSuccess,
  onError,
}) {
  const normalizedActionId = String(actionId ?? "").trim();
  const normalizedSellerId = String(sellerId ?? "").trim();
  const normalizedReason = String(reason ?? "");

  const config = getSellerToolboxSubscriptionOperationConfig(normalizedActionId);
  if (!config) {
    const error = {
      code: "UNKNOWN_OPERATION",
      message: "Operação de assinatura não registrada.",
    };
    onError?.(error);
    return {
      success: false,
      data: null,
      error,
    };
  }

  const requiresReason = config.requiresReason !== false;
  const validation = requiresReason
    ? validateSellerToolboxReasonText(normalizedReason)
    : { isValid: true, errorMessage: "", reasonLength: 0 };

  if (!validation.isValid) {
    const error = {
      code: "INVALID_REASON",
      message: validation.errorMessage,
    };
    onError?.(error);
    return {
      success: false,
      data: null,
      error,
    };
  }

  const handler = execute ?? config.handler;
  const reasonLength = validation.reasonLength;

  const context = {
    sellerId: normalizedSellerId,
    reason: normalizedReason,
    reasonLength,
  };

  logSellerToolbox(
    config.devLog.started,
    config.devLog.buildStartedPayload(normalizedSellerId, metadata ?? undefined),
  );
  logSellerToolbox("operation_started", {
    sellerId: normalizedSellerId,
    actionId: normalizedActionId,
    reasonLength,
  });

  try {
    const data = await handler(context);

    if (!data || typeof data !== "object") {
      throw new Error("fake_execution_failed");
    }

    logSellerToolbox(
      config.devLog.completed,
      config.devLog.buildCompletedPayload(normalizedSellerId, data),
    );
    logSellerToolbox("operation_completed", {
      sellerId: normalizedSellerId,
      actionId: normalizedActionId,
      reasonLength,
    });

    onSuccess?.(data);

    return {
      success: true,
      data,
      error: null,
    };
  } catch (cause) {
    if (config.devLog.failed) {
      logSellerToolbox(
        config.devLog.failed,
        config.devLog.buildFailedPayload(normalizedSellerId, metadata ?? undefined),
      );
    }

    logSellerToolbox("operation_failed", {
      sellerId: normalizedSellerId,
      actionId: normalizedActionId,
      reasonLength,
    });

    const error = {
      code: "EXECUTION_FAILED",
      message:
        cause instanceof Error && cause.message
          ? cause.message
          : "Não foi possível concluir a operação fake.",
    };

    onError?.(error);

    return {
      success: false,
      data: null,
      error,
    };
  }
}

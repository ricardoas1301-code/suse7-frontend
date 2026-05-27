export const FAKE_EXECUTION_MIN_MS = 300;
export const FAKE_EXECUTION_MAX_MS = 700;

/**
 * @returns {Promise<void>}
 */
export function waitFakeOperationDelay() {
  const delayMs =
    FAKE_EXECUTION_MIN_MS +
    Math.floor(Math.random() * (FAKE_EXECUTION_MAX_MS - FAKE_EXECUTION_MIN_MS + 1));

  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

/**
 * DEV ONLY — incluir no motivo para simular falha fake (TEST 03).
 */
export const SELLER_TOOLBOX_DEV_FORCE_ERROR_TOKEN = "[DEV:FORCE_ERROR]";

/**
 * @param {string | null | undefined} reason
 */
export function shouldSimulateSubscriptionOperationFailure(reason) {
  return import.meta.env.DEV && String(reason ?? "").includes(SELLER_TOOLBOX_DEV_FORCE_ERROR_TOKEN);
}

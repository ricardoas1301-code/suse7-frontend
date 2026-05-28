// ======================================================================
// Mensagens de resiliência UX — billing (Fase 3.0.4)
// ======================================================================

export const BILLING_RESILIENCE = {
  timelineError: "Não foi possível carregar a timeline financeira.",
  timelineHint: "Alguns eventos podem demorar alguns segundos para aparecer após o pagamento.",
  timelineRetry: "Tentar novamente",
  healthError: "Não foi possível carregar a saúde financeira agora.",
  healthUnavailable: "Saúde financeira indisponível no momento. Seus pagamentos e assinatura seguem ativos.",
  healthRetry: "Tentar novamente",
  notificationsError: "Não foi possível carregar as notificações recentes.",
  notificationsRetry: "Tentar novamente",
  paymentsError: "Não foi possível carregar o histórico de cobranças.",
  paymentsRetry: "Tentar novamente",
  slowLoading: "Carregando informações financeiras…",
};

/** Timeout padrão para APIs de experiência financeira (ms). */
export const BILLING_FETCH_TIMEOUT_MS = 14_000;

/**
 * @param {Promise<T>} promise
 * @param {number} [ms]
 * @returns {Promise<T>}
 * @template T
 */
export function withBillingFetchTimeout(promise, ms = BILLING_FETCH_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("billing_request_timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

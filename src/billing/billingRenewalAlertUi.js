// ======================================================================

// Alerta modular de cobrança pendente — Minha assinatura (B1+)

// ======================================================================



import { resolveFinancialStateAlert } from "./billingFinancialStateUi.js";



/**

 * Card financeiro exclusivo — GRACE (amarelo) ou SUSPENDED (vermelho), nunca ambos.

 *

 * @param {Record<string, unknown> | null | undefined} renewalExperience

 */

export function resolvePendingRenewalAlert(renewalExperience) {

  return resolveFinancialStateAlert(renewalExperience);

}


// ======================================================================

// Contextos do modal canônico de pagamento (contratação / renovação / reativação)

// ======================================================================



export const BILLING_PAYMENT_CONTEXT = {

  PLAN_CHANGE: "PLAN_CHANGE",

  MONTHLY_RENEWAL: "MONTHLY_RENEWAL",

  MONTHLY_RENEWAL_GRACE: "MONTHLY_RENEWAL_GRACE",

  SUBSCRIPTION_REACTIVATION: "SUBSCRIPTION_REACTIVATION",

  RENEWAL_NOTICE: "RENEWAL_NOTICE",

  PAYMENT_HISTORY: "PAYMENT_HISTORY",

};



export const RECURRING_CONSENT_RULE_VERSION = "block_b_v1";



export const RECURRING_CONSENT_COPY =

  "Ao confirmar, este cartão será utilizado nesta renovação e nas próximas mensalidades, até que a forma de pagamento seja alterada ou a assinatura seja cancelada.";



/**

 * @param {string} context

 * @param {string} paymentMethod

 */

export function resolvePaymentContextConfirmLabel(context, paymentMethod) {

  const method = String(paymentMethod || "PIX").toUpperCase();

  const isReactivation = context === BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION;

  const isGraceRenewal =

    context === BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL_GRACE ||

    context === BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL;



  if (isReactivation) {

    if (method === "PIX") return "Gerar Pix para reativação";

    if (method === "BOLETO") return "Gerar boleto para reativação";

    if (method === "CREDIT_CARD") return "Pagar e reativar assinatura";

  }



  if (isGraceRenewal) {

    if (method === "PIX") return "Gerar Pix";

    if (method === "BOLETO") return "Gerar boleto";

    if (method === "CREDIT_CARD") return "Pagar e ativar renovação automática";

  }



  if (method === "CREDIT_CARD") return "Continuar com cartão";

  if (method === "BOLETO") return "Gerar boleto";

  return "Gerar Pix";

}



/**

 * @param {string} context

 */

export function resolvePaymentContextPresentation(context) {

  if (context === BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION) {

    return {

      title: "Reativar assinatura",

      subtitle: "Escolha como reativar sua assinatura. A cobrança só será criada após sua confirmação.",

      selectorTitle: "Forma de pagamento",

      selectorSubtitle: "O novo período inicia após a confirmação do pagamento.",

      closeOnBackdrop: true,

      showCancelButton: false,

      showRecurringConsent: true,

      reactivationMode: true,

    };

  }



  if (

    context === BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL_GRACE ||

    context === BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL

  ) {

    return {

      title: "Renovar assinatura",

      subtitle: "Escolha como deseja realizar o pagamento da sua mensalidade.",

      selectorTitle: "Forma de pagamento",

      selectorSubtitle:

        "Escolha como deseja pagar. A cobrança só será criada após sua confirmação.",

      closeOnBackdrop: true,

      showCancelButton: false,

      showRecurringConsent: true,

      reactivationMode: false,

    };

  }



  return {

    title: "Renovar plano",

    subtitle: "Escolha como renovar seu plano atual.",

    selectorTitle: "Forma de pagamento",

    selectorSubtitle: "Escolha como renovar seu plano atual. O acesso continua até a confirmação do pagamento.",

    closeOnBackdrop: false,

    showCancelButton: true,

    showRecurringConsent: true,

    reactivationMode: false,

  };

}



/**

 * @param {string[] | null | undefined} availableMethods

 */

export function normalizeAvailablePaymentMethods(availableMethods) {

  if (!Array.isArray(availableMethods) || availableMethods.length === 0) {

    return ["PIX", "CREDIT_CARD", "BOLETO"];

  }

  return availableMethods.map((method) => String(method).toUpperCase());

}



/** @param {string} context */

export function buildBillingPaymentContextCopy(context) {

  return resolvePaymentContextPresentation(context);

}



/** @param {string} context @param {string} paymentMethod */

export function resolveBillingPaymentConfirmLabel(context, paymentMethod) {

  return resolvePaymentContextConfirmLabel(context, paymentMethod);

}



export function buildRenewalRecurringConsentCopy() {

  return {

    message: RECURRING_CONSENT_COPY,

    ruleVersion: RECURRING_CONSENT_RULE_VERSION,

  };

}


// Ordenação visual da Central — não altera motor, filas ou prioridade de disparo.

// Padrão homologado: obrigatórios primeiro; demais em ordem alfabética (pt-BR).



/** @typedef {'in_app_automatic' | 'automatic' | 'manual'} NotificationPresentationGroup */



/**

 * Metadados legados por evento — referência histórica; sort canônico usa mandatory + label.

 * @type {Readonly<Record<string, { group: NotificationPresentationGroup, order: number }>>}

 */

export const NOTIFICATION_PRESENTATION_ORDER = Object.freeze({

  "SALES:ORDER_CANCELLED": { group: "in_app_automatic", order: 10 },

  "PROFIT:NEGATIVE_MARGIN": { group: "in_app_automatic", order: 20 },

  "SALES:DAILY_SALES_SUMMARY": { group: "automatic", order: 10 },

  "SALES:MANUAL_SALE_RAYX": { group: "manual", order: 10 },

  "SALES:MANUAL_SALES_REPORT": { group: "manual", order: 20 },

});



/**

 * @param {Record<string, unknown> | null | undefined} type

 */

function presentationLabel(type) {

  return String(type?.label ?? type?.type_key ?? "");

}



/**

 * @param {Record<string, unknown> | null | undefined} type

 */

function isMandatoryNotificationType(type) {

  return Boolean(type?.is_mandatory);

}



/**

 * @param {Array<{ category: Record<string, unknown>, type: Record<string, unknown> }>} entries

 */

export function sortNotificationTypesForPresentation(entries) {

  return [...entries].sort((a, b) => {

    const mandatoryA = isMandatoryNotificationType(a.type);

    const mandatoryB = isMandatoryNotificationType(b.type);

    if (mandatoryA !== mandatoryB) return mandatoryA ? -1 : 1;



    return presentationLabel(a.type).localeCompare(presentationLabel(b.type), "pt-BR", {

      sensitivity: "base",

    });

  });

}



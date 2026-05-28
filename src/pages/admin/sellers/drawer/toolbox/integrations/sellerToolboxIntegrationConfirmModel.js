/** Operações de integração que exigem confirmação dupla (S1_6.6). */
export const SELLER_TOOLBOX_INTEGRATION_DOUBLE_CONFIRM_ACTION_IDS = Object.freeze([
  "force_marketplace_sync",
  "reimport_marketplace_account",
  "invalidate_integration_cache",
]);

/**
 * @param {string | null | undefined} actionId
 */
export function exigeConfirmacaoDuplaIntegracao(actionId) {
  return SELLER_TOOLBOX_INTEGRATION_DOUBLE_CONFIRM_ACTION_IDS.includes(String(actionId ?? "").trim());
}

/**
 * @param {import("../sellerToolboxConfirmActionModel").SellerToolboxPendingAction} toolboxPendingConfirm
 * @param {{ titulo: string; descricao: string }} copy
 */
export function buildDoubleConfirmDevCenterAction(toolboxPendingConfirm, copy) {
  return {
    id: toolboxPendingConfirm.id,
    titulo: copy.titulo,
    descricao: copy.descricao,
    nivelRisco: "critico",
    rotuloConfirmar: "Entendi, continuar",
    rotuloCancelar: "Cancelar",
    metadados: {
      __toolboxPendingConfirm: toolboxPendingConfirm,
    },
  };
}

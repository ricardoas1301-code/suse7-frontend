import { CONFIGURATION_MILESTONE_ACTION_TYPES } from "./configurationMilestoneActionRegistry.js";

/** @typedef {"LOADING" | "FIRST_CREATE" | "EDIT_EXISTING" | "ERROR"} ConfigurationCompanyDataModalState */

export const CONFIGURATION_COMPANY_DATA_MODAL_STATE = {
  LOADING: "LOADING",
  FIRST_CREATE: "FIRST_CREATE",
  EDIT_EXISTING: "EDIT_EXISTING",
  ERROR: "ERROR",
};

/**
 * Resolve o modo do modal Dados da empresa sem tratar ausência legítima como erro.
 *
 * @param {{
 *   actionType: string;
 *   companyId: string | null;
 *   companyAmbiguous: boolean;
 *   fetchFailed?: boolean;
 *   fetchError?: string | null;
 * }} input
 * @returns {{ state: ConfigurationCompanyDataModalState; error: string | null; shouldFetch: boolean }}
 */
export function resolverEstadoModalDadosEmpresa(input) {
  const {
    actionType,
    companyId,
    companyAmbiguous,
    fetchFailed = false,
    fetchError = null,
  } = input;

  if (actionType !== CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA) {
    return {
      state: CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR,
      error: null,
      shouldFetch: false,
    };
  }

  if (companyAmbiguous) {
    return {
      state: CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR,
      error: "Não foi possível identificar a empresa principal. Ajuste em Perfil → Dados da Empresa.",
      shouldFetch: false,
    };
  }

  if (!companyId) {
    return {
      state: CONFIGURATION_COMPANY_DATA_MODAL_STATE.FIRST_CREATE,
      error: null,
      shouldFetch: false,
    };
  }

  if (fetchFailed) {
    return {
      state: CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR,
      error: fetchError || "Não foi possível carregar os dados.",
      shouldFetch: false,
    };
  }

  return {
    state: CONFIGURATION_COMPANY_DATA_MODAL_STATE.EDIT_EXISTING,
    error: null,
    shouldFetch: true,
  };
}

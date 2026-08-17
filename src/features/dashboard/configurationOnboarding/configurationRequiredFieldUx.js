/**
 * S7.REQUIRED-FIELD-VALIDATION.UX.01 — Configuração Inicial (reuse Signup primitive).
 */
import {
  clearSignupFieldValidity,
  clearSignupFieldValidityForField,
  showSignupFieldValidation,
} from "../../../components/signupFormPresentation.js";

export const CONFIGURATION_REQUIRED_TOAST_TITLE = "Campos obrigatórios";

export {
  clearSignupFieldValidity as clearConfigurationFieldValidity,
  clearSignupFieldValidityForField as clearConfigurationFieldValidityForField,
};

/**
 * @param {HTMLFormElement | null} formEl
 * @param {string | undefined} field
 * @param {string} message
 */
export function showConfigurationFieldValidation(formEl, field, message) {
  if (!field || !formEl) return;
  if (field === "operational_working_days") {
    const checkbox = formEl.querySelector(".s7-operational-working-days input");
    if (checkbox instanceof HTMLElement) {
      checkbox.focus();
    }
    return;
  }
  showSignupFieldValidation(formEl, field, message);
}

/**
 * @param {(payload: Record<string, unknown>) => void} addNotification
 * @param {import("../../../services/notificationTypes.js").NotificationSeverity} severity
 */
export function notifyConfigurationRequiredField(addNotification, message, severity) {
  addNotification({
    event_type: "CONFIGURATION_REQUIRED_FIELD",
    entity_type: "configuration_onboarding",
    entity_id: null,
    title: CONFIGURATION_REQUIRED_TOAST_TITLE,
    message,
    severity,
  });
}

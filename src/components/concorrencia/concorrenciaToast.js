// ======================================================================
// S7 — Concorrência: toasts no padrão oficial (NotificationToast)
// ======================================================================

import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

export function notificarConcorrenciaRemovido(addNotification) {
  notificarConcorrenciaSucesso(addNotification, "Concorrente removido.");
}

export function notificarConcorrenciaSucesso(addNotification, title, message = "") {
  addNotification({
    event_type: "COMPETITION_SUCCESS",
    entity_type: "competition",
    title,
    message: message || "",
    severity: NOTIFICATION_SEVERITY.INFO,
  });
}

export function notificarConcorrenciaAviso(addNotification, title, message = "") {
  addNotification({
    event_type: "COMPETITION_WARNING",
    entity_type: "competition",
    title,
    message: message || "",
    severity: NOTIFICATION_SEVERITY.WARNING,
  });
}

export function mensagemToastCadastroConcorrente(res) {
  if (res?.already_registered) return "Concorrente já cadastrado — dados atualizados.";
  if (res?.reactivated) return "Concorrente reativado com sucesso.";
  return "Concorrente cadastrado com sucesso.";
}

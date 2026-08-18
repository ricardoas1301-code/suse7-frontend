// ======================================================================
// Feedback padronizado — acionamento manual WhatsApp (Raio-X, Relatório…)
// ======================================================================

import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

/**
 * Toast inicial enquanto o motor central processa o envio.
 * @param {(title: string, message?: string, severity?: string) => void} notifyToast
 */
export function notifyManualWhatsAppSending(notifyToast) {
  notifyToast("Enviando WhatsApp…", "");
}

/**
 * @param {(title: string, message?: string, severity?: string) => void} notifyToast
 * @param {{ ok?: boolean; error?: string; data?: Record<string, unknown> }} res
 * @returns {"sent" | "queued" | "skipped" | "error"}
 */
export function finishManualWhatsAppMotorNotify(notifyToast, res) {
  const data = res?.data;

  if (!res?.ok || data?.success !== true) {
    notifyToast(
      "Não foi possível enviar o WhatsApp agora.",
      "Tente novamente em instantes.",
      NOTIFICATION_SEVERITY.WARNING,
    );
    return "error";
  }

  if (data?.skipped || data?.status === "skipped") {
    notifyToast(
      "Envio já registrado",
      "Esta mensagem já foi enviada recentemente para este canal.",
    );
    return "skipped";
  }

  const sent =
    data?.real_send_executed === true || (data?.status === "sent" && data?.mocked === false);
  const partial = data?.status === "partial" && data?.real_send_executed === true;

  if (sent || partial) {
    const count = data?.dispatches_created ?? data?.selected_recipient_phones?.length ?? 1;
    notifyToast(
      data?.multi && count > 1
        ? `WhatsApp enviado para ${count} destinatários.`
        : "WhatsApp enviado com sucesso.",
      "",
    );
    return "sent";
  }

  const hint = data?.mocked ? "Modo seguro (mock)." : "Entrega em processamento.";
  notifyToast("WhatsApp enfileirado com sucesso.", hint);
  return "queued";
}

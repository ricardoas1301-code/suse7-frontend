// ======================================================================

// Feedback padronizado — acionamento manual E-mail (Relatório, Raio-X…)

// ======================================================================



import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";



/**

 * @param {(title: string, message?: string, severity?: string) => void} notifyToast

 */

export function notifyManualEmailSending(notifyToast) {

  notifyToast("Enviando e-mail…", "");

}



/**

 * @param {(title: string, message?: string, severity?: string) => void} notifyToast

 * @param {{ ok?: boolean; error?: string; data?: Record<string, unknown> }} res

 * @returns {"sent" | "queued" | "skipped" | "error"}

 */

export function finishManualEmailMotorNotify(notifyToast, res) {

  const data = res?.data ?? res;



  if (!res?.ok && data?.success !== true && data?.ok !== true) {

    notifyToast(

      "Não foi possível enviar o e-mail agora.",

      "Tente novamente em instantes.",

      NOTIFICATION_SEVERITY.WARNING,

    );

    return "error";

  }



  if (data?.skipped || data?.status === "skipped") {

    notifyToast(

      "Envio já registrado",

      "Este e-mail já foi enviado recentemente para este destinatário.",

    );

    return "skipped";

  }



  const sent =

    data?.real_send_executed === true || (data?.status === "sent" && data?.mocked === false);

  const partial = data?.status === "partial" && data?.real_send_executed === true;



  if (sent || partial) {

    const count = data?.dispatches_created ?? data?.selected_recipient_emails?.length ?? 1;

    notifyToast(

      data?.multi && count > 1

        ? `E-mail enviado para ${count} destinatários.`

        : "E-mail enviado com sucesso.",

      "",

    );

    return "sent";

  }



  const hint = data?.mocked ? "Modo seguro (mock)." : "Entrega em processamento.";

  notifyToast("E-mail enfileirado com sucesso.", hint);

  return "queued";

}



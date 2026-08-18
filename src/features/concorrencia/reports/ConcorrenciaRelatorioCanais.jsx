// ======================================================================
// Barra de canais do Relatório de Concorrência — padrão global S7 (Vendas).
// Canais ativos: WhatsApp · E-mail · Copiar · Imprimir · Excel
// ======================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";
import { useNotifications } from "../../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes";
import {
  fetchCentralNotificationRecipients,
  fetchCentralEventDeliveryRules,
} from "../../../services/centralNotificationsApi";
import { buildConcorrenciaSharePayload } from "./share/buildConcorrenciaSharePayload.js";
import { copyConcorrenciaReportToClipboard } from "./share/copyConcorrenciaReport.jsx";
import { printConcorrenciaReport } from "./share/printConcorrenciaReport.js";
import { downloadConcorrenciaReportXlsx } from "./share/buildConcorrenciaReportXlsx.js";
import { shareConcorrenciaReportWhatsApp } from "./share/shareConcorrenciaReportWhatsApp.js";
import { shareConcorrenciaReportEmail } from "./share/shareConcorrenciaReportEmail.js";
import { pickConcorrenciaReportWhatsAppRecipients } from "./share/pickConcorrenciaReportWhatsAppRecipient.js";
import { pickConcorrenciaReportEmailRecipients } from "./share/pickConcorrenciaReportEmailRecipient.js";
import {
  finishManualWhatsAppMotorNotify,
  notifyManualWhatsAppSending,
} from "../../../shared/notifications/finishManualWhatsAppMotorNotify.js";
import {
  finishManualEmailMotorNotify,
  notifyManualEmailSending,
} from "../../../shared/notifications/finishManualEmailMotorNotify.js";

const COPY_FEEDBACK_MS = 2000;

/**
 * @param {{
 *   aggregatedReport?: import("./buildConcorrenciaAggregatedReport.js").ReturnType<typeof import("./buildConcorrenciaAggregatedReport.js").buildConcorrenciaAggregatedReport> | null;
 *   reportContext?: import("./buildConcorrenciaReportContext.js").ConcorrenciaReportContext | null;
 * }} props
 */
export default function ConcorrenciaRelatorioCanais({ aggregatedReport = null, reportContext = null }) {
  const { addNotification } = useNotifications();
  const canShare = Boolean(aggregatedReport && reportContext);

  const [copyFeedback, setCopyFeedback] = useState(null);
  const [copying, setCopying] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [sharingEmail, setSharingEmail] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState(null);

  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const whatsappTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const emailTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      if (whatsappTimeoutRef.current != null) clearTimeout(whatsappTimeoutRef.current);
      if (emailTimeoutRef.current != null) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  const notifyToast = useCallback(
    (title, message = "", severity = NOTIFICATION_SEVERITY.INFO, eventType = "CONCORRENCIA_REPORT_NOTIFY") => {
      addNotification({
        event_type: eventType,
        entity_type: "competition_report",
        title,
        message,
        severity,
      });
    },
    [addNotification],
  );

  const flashCopyFeedback = useCallback((kind) => {
    if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    setCopyFeedback(kind);
    timeoutRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const flashWhatsAppFeedback = useCallback((kind) => {
    if (whatsappTimeoutRef.current != null) clearTimeout(whatsappTimeoutRef.current);
    setWhatsappFeedback(kind);
    whatsappTimeoutRef.current = setTimeout(() => setWhatsappFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const flashEmailFeedback = useCallback((kind) => {
    if (emailTimeoutRef.current != null) clearTimeout(emailTimeoutRef.current);
    setEmailFeedback(kind);
    emailTimeoutRef.current = setTimeout(() => setEmailFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const buildSharePayload = useCallback(
    () => buildConcorrenciaSharePayload(aggregatedReport, reportContext),
    [aggregatedReport, reportContext],
  );

  const handleCopy = useCallback(async () => {
    if (copying || !canShare) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setCopying(true);
    try {
      const outcome = await copyConcorrenciaReportToClipboard(payload);
      if (outcome) flashCopyFeedback(outcome);
    } finally {
      setCopying(false);
    }
  }, [buildSharePayload, canShare, copying, flashCopyFeedback]);

  const handlePrint = useCallback(async () => {
    if (printing || !canShare) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setPrinting(true);
    try {
      await printConcorrenciaReport(payload);
    } catch {
      /* silencioso */
    } finally {
      setPrinting(false);
    }
  }, [buildSharePayload, canShare, printing]);

  const handleExcel = useCallback(async () => {
    if (exporting || !canShare) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setExporting(true);
    try {
      await downloadConcorrenciaReportXlsx(payload);
    } finally {
      setExporting(false);
    }
  }, [buildSharePayload, canShare, exporting]);

  const handleWhatsApp = useCallback(async () => {
    if (sharingWhatsApp || !canShare) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setSharingWhatsApp(true);
    notifyManualWhatsAppSending((title, message, severity) =>
      notifyToast(title, message, severity, "CONCORRENCIA_REPORT_WHATSAPP_NOTIFY"),
    );
    try {
      const [recipientsRes, rulesRes] = await Promise.all([
        fetchCentralNotificationRecipients(),
        fetchCentralEventDeliveryRules(),
      ]);
      const { targets } = pickConcorrenciaReportWhatsAppRecipients({
        groups: recipientsRes?.ok ? recipientsRes.groups : [],
        rules: rulesRes?.ok ? rulesRes.rules : [],
      });

      if (!targets.length) {
        notifyToast(
          "Nenhum destinatário de WhatsApp configurado para Relatório de Concorrência.",
          "Configure em Perfil → Preferências → Notificações → Concorrência.",
          NOTIFICATION_SEVERITY.WARNING,
          "CONCORRENCIA_REPORT_WHATSAPP_NOTIFY",
        );
        return;
      }

      const sendRes = await shareConcorrenciaReportWhatsApp(payload, { targets });
      const outcome = finishManualWhatsAppMotorNotify(
        (title, message, severity) =>
          notifyToast(title, message, severity, "CONCORRENCIA_REPORT_WHATSAPP_NOTIFY"),
        sendRes,
      );
      if (outcome === "sent" || outcome === "queued" || outcome === "skipped") {
        flashWhatsAppFeedback(outcome === "sent" ? "sent" : "queued");
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Relatório Concorrência WhatsApp]", err);
      }
      notifyToast(
        "Não foi possível compartilhar pelo WhatsApp.",
        "Tente novamente em instantes.",
        NOTIFICATION_SEVERITY.WARNING,
        "CONCORRENCIA_REPORT_WHATSAPP_NOTIFY",
      );
    } finally {
      setSharingWhatsApp(false);
    }
  }, [buildSharePayload, canShare, sharingWhatsApp, flashWhatsAppFeedback, notifyToast]);

  const handleEmail = useCallback(async () => {
    if (sharingEmail || !canShare) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setSharingEmail(true);
    notifyManualEmailSending((title, message, severity) =>
      notifyToast(title, message, severity, "CONCORRENCIA_REPORT_EMAIL_NOTIFY"),
    );
    try {
      const [recipientsRes, rulesRes] = await Promise.all([
        fetchCentralNotificationRecipients(),
        fetchCentralEventDeliveryRules(),
      ]);
      const { targets } = pickConcorrenciaReportEmailRecipients({
        groups: recipientsRes?.ok ? recipientsRes.groups : [],
        rules: rulesRes?.ok ? rulesRes.rules : [],
      });

      if (!targets.length) {
        notifyToast(
          "Nenhum destinatário de E-mail configurado para Relatório de Concorrência.",
          "Configure em Perfil → Preferências → Notificações → Concorrência.",
          NOTIFICATION_SEVERITY.WARNING,
          "CONCORRENCIA_REPORT_EMAIL_NOTIFY",
        );
        return;
      }

      const sendRes = await shareConcorrenciaReportEmail(payload, { targets });
      const outcome = finishManualEmailMotorNotify(
        (title, message, severity) =>
          notifyToast(title, message, severity, "CONCORRENCIA_REPORT_EMAIL_NOTIFY"),
        sendRes,
      );
      if (outcome === "sent" || outcome === "queued" || outcome === "skipped") {
        flashEmailFeedback(outcome === "sent" ? "sent" : "queued");
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Relatório Concorrência E-mail]", err);
      }
      notifyToast(
        "Não foi possível compartilhar por E-mail.",
        "Tente novamente em instantes.",
        NOTIFICATION_SEVERITY.WARNING,
        "CONCORRENCIA_REPORT_EMAIL_NOTIFY",
      );
    } finally {
      setSharingEmail(false);
    }
  }, [buildSharePayload, canShare, sharingEmail, flashEmailFeedback, notifyToast]);

  const copyCopied = copyFeedback != null;
  const copyTooltip =
    copyFeedback === "rich" || copyFeedback === "image"
      ? "Copiado!"
      : copyFeedback === "text"
        ? "Copiado como texto"
        : S7_MODAL_SHARE_ACTION_LABELS.copy;

  return (
    <div
      className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
      role="toolbar"
      aria-label="Canais de exportação"
    >
      {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
        const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];

        if (actionId === "whatsapp" && canShare) {
          const waCopied = whatsappFeedback != null;
          const waTooltip =
            whatsappFeedback === "sent"
              ? "WhatsApp enviado!"
              : whatsappFeedback === "queued"
                ? "WhatsApp enfileirado!"
                : label;
          return (
            <S7Tooltip key={actionId} content={waTooltip} placement="bottom-start" offset={6}>
              <button
                type="button"
                className={[
                  "vendas-sale-rayx__ops-icon-btn",
                  waCopied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                onClick={handleWhatsApp}
                disabled={sharingWhatsApp}
              >
                {waCopied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
              </button>
            </S7Tooltip>
          );
        }

        if (actionId === "email" && canShare) {
          const emCopied = emailFeedback != null;
          const emTooltip =
            emailFeedback === "sent"
              ? "E-mail enviado!"
              : emailFeedback === "queued"
                ? "E-mail enfileirado!"
                : label;
          return (
            <S7Tooltip key={actionId} content={emTooltip} placement="bottom-start" offset={6}>
              <button
                type="button"
                className={[
                  "vendas-sale-rayx__ops-icon-btn",
                  emCopied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                onClick={handleEmail}
                disabled={sharingEmail}
              >
                {emCopied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
              </button>
            </S7Tooltip>
          );
        }

        if (actionId === "copy" && canShare) {
          return (
            <S7Tooltip key={actionId} content={copyTooltip} placement="bottom-start" offset={6}>
              <button
                type="button"
                className={[
                  "vendas-sale-rayx__ops-icon-btn",
                  copyCopied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                onClick={handleCopy}
                disabled={copying}
              >
                {copyCopied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
              </button>
            </S7Tooltip>
          );
        }

        if (actionId === "print" && canShare) {
          return (
            <S7Tooltip key={actionId} content={label} placement="bottom-start" offset={6}>
              <button
                type="button"
                className="vendas-sale-rayx__ops-icon-btn"
                aria-label={label}
                onClick={handlePrint}
                disabled={printing}
              >
                <S7ModalShareActionIcon actionId={actionId} />
              </button>
            </S7Tooltip>
          );
        }

        if (actionId === "csv" && canShare) {
          return (
            <S7Tooltip key={actionId} content="Exportar Excel" placement="bottom-start" offset={6}>
              <button
                type="button"
                className="vendas-sale-rayx__ops-icon-btn"
                aria-label="Exportar Excel"
                onClick={handleExcel}
                disabled={exporting}
              >
                <S7ModalShareActionIcon actionId={actionId} />
              </button>
            </S7Tooltip>
          );
        }

        return null;
      })}
    </div>
  );
}

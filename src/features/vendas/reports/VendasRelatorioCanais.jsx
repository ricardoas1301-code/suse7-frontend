// ======================================================================
// Barra de canais do relatório — padrão global S7 (Raio-X).
// Canal Copiar = relatório completo (executivo + detalhamento), mesma fonte do Imprimir.
// WhatsApp + E-mail = motor central (imagem + Excel via buildVendasReportShareAssets).
// Excel = download via buildVendasReportXlsx (mesma fonte do anexo).
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
import { buildVendasSharePayload } from "./share/buildVendasSharePayload.js";
import { copyVendasReportToClipboard } from "./share/copyVendasReportToClipboard.jsx";
import { printVendasReport } from "./share/printVendasReport.js";
import { downloadVendasReportXlsx } from "./share/buildVendasReportXlsx.js";
import { shareVendasReportWhatsApp } from "./share/shareVendasReportWhatsApp.js";
import { shareVendasReportEmail } from "./share/shareVendasReportEmail.js";
import { pickVendasReportWhatsAppRecipients } from "./share/pickVendasReportWhatsAppRecipient.js";
import { pickVendasReportEmailRecipients } from "./share/pickVendasReportEmailRecipient.js";
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
 *   aggregatedReport?: import("./buildVendasAggregatedReport.js").VendasAggregatedReport | null;
 *   reportContext?: import("./buildVendasReportContext.js").VendasReportContext | null;
 *   visibleActions?: readonly import("../../../shared/modalActions/s7ModalShareActions.js").S7ModalShareActionId[];
 * }} props
 */
export default function VendasRelatorioCanais({
  aggregatedReport = null,
  reportContext = null,
  visibleActions = S7_MODAL_SHARE_ACTION_ORDER,
}) {
  const { addNotification } = useNotifications();
  const canCopy = Boolean(aggregatedReport);
  const canPrint = Boolean(aggregatedReport);
  const canWhatsApp = Boolean(aggregatedReport);
  const canEmail = Boolean(aggregatedReport);
  const canExcel = Boolean(aggregatedReport);
  const allowedActions = new Set(Array.isArray(visibleActions) ? visibleActions : S7_MODAL_SHARE_ACTION_ORDER);
  // null | "rich" | "text"
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [copying, setCopying] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [sharingEmail, setSharingEmail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const notifyToast = useCallback(
    (title, message = "", severity = NOTIFICATION_SEVERITY.INFO) => {
      addNotification({
        event_type: "VENDAS_REPORT_WHATSAPP_NOTIFY",
        entity_type: "sales_report",
        title,
        message,
        severity,
      });
    },
    [addNotification],
  );

  // null | "sent" | "queued" | "skipped"
  const [whatsappFeedback, setWhatsappFeedback] = useState(null);
  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const whatsappTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const emailTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  // null | "sent" | "queued" | "skipped"
  const [emailFeedback, setEmailFeedback] = useState(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      if (whatsappTimeoutRef.current != null) clearTimeout(whatsappTimeoutRef.current);
      if (emailTimeoutRef.current != null) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  const flashFeedback = useCallback((kind) => {
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
    () => buildVendasSharePayload(aggregatedReport, reportContext),
    [aggregatedReport, reportContext],
  );

  const handleCopy = useCallback(async () => {
    if (copying) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setCopying(true);
    try {
      const outcome = await copyVendasReportToClipboard(payload);
      if (outcome) flashFeedback(outcome);
    } finally {
      setCopying(false);
    }
  }, [buildSharePayload, copying, flashFeedback]);

  const handlePrint = useCallback(async () => {
    if (printing) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setPrinting(true);
    try {
      await printVendasReport(payload);
    } catch {
      // Fallback seguro: impressão indisponível (pop-up/iframe bloqueado).
    } finally {
      setPrinting(false);
    }
  }, [buildSharePayload, printing]);

  const handleWhatsApp = useCallback(async () => {
    if (sharingWhatsApp) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setSharingWhatsApp(true);
    notifyManualWhatsAppSending(notifyToast);
    try {
      // Missão 1 — destinatários configurados em SALES:MANUAL_SALES_REPORT (whatsapp).
      const [recipientsRes, rulesRes] = await Promise.all([
        fetchCentralNotificationRecipients(),
        fetchCentralEventDeliveryRules(),
      ]);
      const { targets } = pickVendasReportWhatsAppRecipients({
        groups: recipientsRes?.ok ? recipientsRes.groups : [],
        rules: rulesRes?.ok ? rulesRes.rules : [],
      });

      if (!targets.length) {
        notifyToast(
          "Nenhum destinatário de WhatsApp configurado para Relatório de Vendas.",
          "Configure em Perfil → Preferências → Notificações → Vendas.",
          NOTIFICATION_SEVERITY.WARNING,
        );
        return;
      }

      const sendRes = await shareVendasReportWhatsApp(payload, { targets });
      const outcome = finishManualWhatsAppMotorNotify(notifyToast, sendRes);
      if (outcome === "sent" || outcome === "queued" || outcome === "skipped") {
        flashWhatsAppFeedback(outcome === "sent" ? "sent" : "queued");
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Relatório Vendas WhatsApp]", err);
      }
      notifyToast(
        "Não foi possível compartilhar pelo WhatsApp.",
        "Tente novamente em instantes.",
        NOTIFICATION_SEVERITY.WARNING,
      );
    } finally {
      setSharingWhatsApp(false);
    }
  }, [buildSharePayload, sharingWhatsApp, flashWhatsAppFeedback, notifyToast]);

  const handleEmail = useCallback(async () => {
    if (sharingEmail) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setSharingEmail(true);
    notifyManualEmailSending(notifyToast);
    try {
      const [recipientsRes, rulesRes] = await Promise.all([
        fetchCentralNotificationRecipients(),
        fetchCentralEventDeliveryRules(),
      ]);
      const { targets } = pickVendasReportEmailRecipients({
        groups: recipientsRes?.ok ? recipientsRes.groups : [],
        rules: rulesRes?.ok ? rulesRes.rules : [],
      });

      if (!targets.length) {
        notifyToast(
          "Nenhum destinatário de E-mail configurado para Relatório de Vendas.",
          "Configure em Perfil → Preferências → Notificações → Vendas.",
          NOTIFICATION_SEVERITY.WARNING,
        );
        return;
      }

      const sendRes = await shareVendasReportEmail(payload, { targets });
      const outcome = finishManualEmailMotorNotify(notifyToast, sendRes);
      if (outcome === "sent" || outcome === "queued" || outcome === "skipped") {
        flashEmailFeedback(outcome === "sent" ? "sent" : "queued");
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Relatório Vendas E-mail]", err);
      }
      notifyToast(
        "Não foi possível enviar por E-mail.",
        "Tente novamente em instantes.",
        NOTIFICATION_SEVERITY.WARNING,
      );
    } finally {
      setSharingEmail(false);
    }
  }, [buildSharePayload, sharingEmail, flashEmailFeedback, notifyToast]);

  const handleExcel = useCallback(async () => {
    if (exporting) return;
    const payload = buildSharePayload();
    if (!payload) return;

    setExporting(true);
    try {
      await downloadVendasReportXlsx(payload);
    } finally {
      setExporting(false);
    }
  }, [buildSharePayload, exporting]);

  const copied = copyFeedback != null;
  const copyTooltip =
    copyFeedback === "image"
      ? "Copiado!"
      : S7_MODAL_SHARE_ACTION_LABELS.copy;

  return (
    <div
      className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
      role="toolbar"
      aria-label="Canais de exportação"
    >
      {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
        if (!allowedActions.has(actionId)) return null;
        const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];

        if (actionId === "whatsapp" && canWhatsApp) {
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

        if (actionId === "email" && canEmail) {
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

        if (actionId === "copy" && canCopy) {
          return (
            <S7Tooltip key={actionId} content={copyTooltip} placement="bottom-start" offset={6}>
              <button
                type="button"
                className={[
                  "vendas-sale-rayx__ops-icon-btn",
                  copied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
              </button>
            </S7Tooltip>
          );
        }

        if (actionId === "print" && canPrint) {
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

        if (actionId === "csv" && canExcel) {
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

        return (
          <S7Tooltip key={actionId} content={`${label} — em breve`} placement="bottom-start" offset={6}>
            <button
              type="button"
              className="vendas-sale-rayx__ops-icon-btn"
              aria-label={label}
              disabled
              title="Disponível em fase futura"
            >
              <S7ModalShareActionIcon actionId={actionId} />
            </button>
          </S7Tooltip>
        );
      })}
    </div>
  );
}

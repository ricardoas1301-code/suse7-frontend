// ======================================================

// Barra de ações — Raio-x da venda (ícones diretos, sem dropdown).

// ======================================================



import { useCallback, useRef, useState } from "react";

import { Copy, Mail, Printer, Share2 } from "lucide-react";

import { useNotifications } from "../../contexts/NotificationContext";

import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

import {
  fetchCentralNotificationRecipients,
  fetchCentralEventDeliveryRules,
} from "../../services/centralNotificationsApi";
import { pickRayxManualWhatsAppRecipients } from "../../services/pickRayxManualWhatsAppRecipient";
import {
  copySaleRayxShare,
  printSaleRayxShare,
  sendSaleRayxWhatsAppShare,
} from "../../shared/renderers/saleRayx";

import S7Tooltip from "../ui/S7Tooltip";

import {
  buildSaleRayxSummary,
  SALE_RAYX_BRAND_TITLE,
} from "./saleRayxSummary";

import { tryNativeShare } from "./saleRayxSharePrint";



/** Ícone WhatsApp (16–18px) — sem dependência extra. */

function WhatsAppIcon({ size = 17 }) {

  return (

    <svg

      width={size}

      height={size}

      viewBox="0 0 24 24"

      fill="currentColor"

      aria-hidden="true"

      focusable="false"

    >

      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />

    </svg>

  );

}



/**

 * @param {{

 *   saleId?: string | null;

 *   general?: Record<string, unknown> | null;

 *   product?: Record<string, unknown> | null;

 *   financial?: Record<string, unknown> | null;

 *   profitMargin?: Record<string, unknown> | null;

 *   listingTitle?: string | null;

 *   saleContextMetrics?: Record<string, unknown> | null;

 *   placement?: "footer" | "header";

 * }} props

 */

export default function SaleRayXOperationalActions({

  saleId,

  general,

  product,

  financial,

  profitMargin,

  listingTitle,

  saleContextMetrics,

  placement = "header",

}) {

  const { addNotification } = useNotifications();

  const [loadingKey, setLoadingKey] = useState(null);

  const inFlightRef = useRef(null);



  const shareInput = {
    saleId: String(saleId ?? ""),
    general,
    product,
    financial,
    profitMargin,
    listingTitle,
    saleContextMetrics,
  };

  const summaryText = buildSaleRayxSummary(shareInput);

  const shareSubject = SALE_RAYX_BRAND_TITLE;



  const notifyToast = useCallback(

    (title, message = "", severity = NOTIFICATION_SEVERITY.INFO) => {

      addNotification({

        event_type: "LISTING_ID_COPIED",

        entity_type: "marketplace_listing",

        title,

        message,

        severity,

      });

    },

    [addNotification],

  );



  const copySummary = useCallback(async () => {

    try {

      await copySaleRayxShare(shareInput);

      notifyToast("📋 Raio-X da Venda S7 copiado");

    } catch {

      addNotification({

        event_type: "LISTING_ID_COPY_FAILED",

        entity_type: "marketplace_listing",

        title: "Não foi possível copiar",

        message: "Verifique permissões do navegador ou use HTTPS.",

        severity: NOTIFICATION_SEVERITY.WARNING,

      });

    }

  }, [addNotification, notifyToast, shareInput]);



  const finishMotorNotify = useCallback((channel, res) => {

    const data = res?.data;

    if (!res?.ok || data?.success !== true) {

      const msg =

        channel === "whatsapp"

          ? "Não foi possível acionar o WhatsApp agora."

          : "Não foi possível acionar o e-mail agora.";

      notifyToast(msg, res?.error ?? data?.error ?? "", NOTIFICATION_SEVERITY.WARNING);

      return;

    }



    if (data?.skipped || data?.status === "skipped") {

      const hint =

        data?.outbox_status === "sent"

          ? "Mensagem já enviada nesta janela de 5 minutos."

          : "Esta venda já foi acionada recentemente para este canal.";

      notifyToast("Envio já registrado", hint);

      return;

    }



    if (channel === "whatsapp") {
      if (import.meta.env.DEV && data?.duplicate_recipients_removed?.length) {
        console.warn("[S7 Raio-X manual] duplicados removidos", data.duplicate_recipients_removed);
      }

      if (import.meta.env.DEV && data?.backend_debug) {
        console.info("[S7 Raio-X manual] resposta", {
          api_origin: data.backend_debug.api_origin,
          live_process_reason: data.live_process_reason,
          real_send_executed: data.real_send_executed,
          process_outbox_called: data.process_outbox_called,
          outbox_status_after: data.outbox_status_after,
          provider_message_id: data.provider_message_id,
          original_recipient_phone: data.original_recipient_phone,
          normalized_destination_phone: data.normalized_destination_phone,
          smoke_override_applied: data.smoke_override_applied,
          live_destination_source: data.live_destination_source,
          live_policy_applied: data.live_policy_applied,
          sandbox_whitelist_applied: data.sandbox_whitelist_applied,
          whitelist_bypass_reason: data.whitelist_bypass_reason,
        });
      }

      const sent =
        data?.real_send_executed === true ||
        (data?.status === "sent" && data?.mocked === false);
      const partial = data?.status === "partial" && data?.real_send_executed === true;

      if (sent || partial) {
        const count = data?.dispatches_created ?? data?.selected_recipient_phones?.length ?? 1;
        notifyToast(
          data?.multi && count > 1
            ? `WhatsApp enviado para ${count} destinatários.`
            : "WhatsApp enviado com sucesso.",
          data?.provider_message_id ? `ID: ${data.provider_message_id}` : "Entrega confirmada pelo provedor.",
        );
      } else {
        const remoteHint =
          data?.backend_debug?.api_origin &&
          /vercel\.app/i.test(String(data.backend_debug.api_origin))
            ? "Backend remoto (Vercel) — sem live local."
            : "";
        const hint =
          [data?.live_process_reason, remoteHint, data?.mocked ? "Modo seguro (mock)." : ""]
            .filter(Boolean)
            .join(" — ") || "Sem envio real.";
        notifyToast("WhatsApp enfileirado com sucesso.", hint);
      }
      return;
    }



    const mockHint = data?.mocked ? "Modo seguro (mock) — sem envio real." : "";

    notifyToast("E-mail enfileirado com sucesso.", mockHint);

  }, [notifyToast]);



  const triggerMotorNotify = useCallback(

    async (channel) => {

      if (!saleId) {

        notifyToast(

          "Venda não identificada",

          "Não foi possível acionar o envio.",

          NOTIFICATION_SEVERITY.WARNING,

        );

        return;

      }



      try {
        if (channel === "whatsapp") {
          const [listed, rulesRes] = await Promise.all([
            fetchCentralNotificationRecipients(),
            fetchCentralEventDeliveryRules(),
          ]);
          if (!listed.ok) {
            notifyToast(
              "Não foi possível acionar o WhatsApp agora.",
              listed.error ?? "Destinatários indisponíveis.",
              NOTIFICATION_SEVERITY.WARNING,
            );
            return;
          }
          const picked = pickRayxManualWhatsAppRecipients({
            recipients: listed.recipients,
            groups: listed.groups,
            rules: rulesRes.ok ? rulesRes.rules : [],
          });
          const targets = picked.targets;
          if (!targets.length) {
            notifyToast(
              "WhatsApp sem destinatário",
              "Marque destinatários WhatsApp ativos em Notificações → Raio-X da venda.",
              NOTIFICATION_SEVERITY.WARNING,
            );
            return;
          }
          if (import.meta.env.DEV) {
            console.info("[S7 Raio-X manual] destinatários selecionados", {
              selected_targets_source: picked.selected_targets_source,
              enabled_group_ids: picked.enabled_group_ids,
              final_recipient_targets: targets.map((t) => t.recipientPhone),
            });
          }

          const sendRes = await sendSaleRayxWhatsAppShare({
            ...shareInput,
            saleId: String(saleId),
            recipientTargets: targets,
          });

          finishMotorNotify(channel, sendRes.apiResponse);
          return;
        }

        const { postSaleRayxManualNotification } = await import("../../services/saleRayxManualNotifyApi");
        const payload = {
          saleId: String(saleId),
          channel,
        };
        const res = await postSaleRayxManualNotification(payload);
        finishMotorNotify(channel, res);

      } catch {

        notifyToast(

          channel === "whatsapp"

            ? "Não foi possível acionar o WhatsApp agora."

            : "Não foi possível acionar o e-mail agora.",

          "",

          NOTIFICATION_SEVERITY.WARNING,

        );

      } finally {

        inFlightRef.current = null;

        setLoadingKey(null);

      }

    },

    [finishMotorNotify, notifyToast, saleId, shareInput],

  );



  const startMotorNotify = useCallback(

    (channel) => {

      if (inFlightRef.current) return;

      if (!saleId) {

        notifyToast(

          "Venda não identificada",

          "Não foi possível acionar o envio.",

          NOTIFICATION_SEVERITY.WARNING,

        );

        return;

      }

      inFlightRef.current = channel;

      setLoadingKey(channel);

      if (channel === "whatsapp") {

        notifyToast("Enviando WhatsApp…", "");

      } else {

        notifyToast("Enviando e-mail…", "");

      }

      void triggerMotorNotify(channel);

    },

    [notifyToast, saleId, triggerMotorNotify],

  );



  const handleWhatsApp = useCallback(() => {

    startMotorNotify("whatsapp");

  }, [startMotorNotify]);



  const handleEmail = useCallback(() => {

    startMotorNotify("email");

  }, [startMotorNotify]);



  const handlePrint = useCallback(async () => {

    notifyToast("🖨️ Gerando impressão");

    try {

      await printSaleRayxShare({ ...shareInput, saleId: String(saleId ?? "") });

    } catch {

      addNotification({

        event_type: "LISTING_ID_COPY_FAILED",

        entity_type: "marketplace_listing",

        title: "Não foi possível imprimir",

        message: "Tente novamente ou use Copiar resumo.",

        severity: NOTIFICATION_SEVERITY.WARNING,

      });

    }

  }, [addNotification, notifyToast, saleId, shareInput]);



  const handleNativeShare = useCallback(async () => {

    const ok = await tryNativeShare({ title: shareSubject, text: summaryText });

    if (!ok) await copySummary();

  }, [copySummary, shareSubject, summaryText]);



  const opsClass = [

    "vendas-sale-rayx__ops-actions",

    "vendas-sale-rayx__ops-actions--icon-bar",

    placement === "header" ? "vendas-sale-rayx__ops-actions--header" : "",

  ]

    .filter(Boolean)

    .join(" ");



  const notifyBusy = loadingKey === "whatsapp" || loadingKey === "email";



  const actions = [

    {

      key: "whatsapp",

      label: "Enviar por WhatsApp",

      onClick: handleWhatsApp,

      icon: <WhatsAppIcon />,

    },

    {

      key: "email",

      label: "Enviar por E-mail",

      onClick: handleEmail,

      icon: <Mail size={17} strokeWidth={2} aria-hidden />,

    },

    {

      key: "copy",

      label: "Copiar resumo",

      onClick: () => void copySummary(),

      icon: <Copy size={17} strokeWidth={2} aria-hidden />,

    },

    {

      key: "share",

      label: "Compartilhar",

      onClick: () => void handleNativeShare(),

      icon: <Share2 size={17} strokeWidth={2} aria-hidden />,

    },

    {

      key: "print",

      label: "Imprimir",

      onClick: handlePrint,

      icon: <Printer size={17} strokeWidth={2} aria-hidden />,

    },

  ];



  return (

    <div className={opsClass} role="toolbar" aria-label="Ações do Raio-x da venda">

      {actions.map((action) => {

        const isLoading = loadingKey === action.key;

        const isNotify = action.key === "whatsapp" || action.key === "email";

        return (

          <S7Tooltip key={action.key} content={action.label} placement="bottom-start" offset={6}>

            <button

              type="button"

              className={[

                "vendas-sale-rayx__ops-icon-btn",

                action.key === "share" ? "sale-rayx-action--native-share" : "",

                isLoading ? "vendas-sale-rayx__ops-icon-btn--loading" : "",

              ]

                .filter(Boolean)

                .join(" ")}

              aria-label={action.label}

              aria-busy={isLoading}

              disabled={isLoading || (isNotify && notifyBusy && !isLoading)}

              onClick={action.onClick}

            >

              {action.icon}

            </button>

          </S7Tooltip>

        );

      })}

    </div>

  );

}



import { API_BASE_URL, buildApiUrl, apiFetch } from "../../config/api";

export async function sendWhatsAppNotification({ to, template, variables, notification }) {
  const safeTo = String(to ?? "").trim();
  if (!safeTo) {
    return { ok: false, skipped: true, reason: "missing_whatsapp_number" };
  }

  const providerConfigured = Boolean(import.meta.env.VITE_NOTIFICATIONS_WHATSAPP_PROVIDER);
  if (!providerConfigured || !API_BASE_URL) {
    if (import.meta.env.DEV) {
      console.info("[whatsappNotificationProvider] dry-run", {
        to_masked: safeTo.replace(/\d(?=\d{4})/g, "*"),
        template: template ?? "default",
        notification_type: notification?.notification_type,
      });
    }
    return { ok: true, dryRun: true };
  }

  const url = buildApiUrl("/api/notifications/channels/whatsapp");
  if (!url) {
    return { ok: false, skipped: true, reason: "invalid_api_url" };
  }

  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      to: safeTo,
      template: template ?? "suse7_alert",
      variables: variables ?? {},
      notification,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "whatsapp_send_failed" };
  }
  return { ok: true };
}


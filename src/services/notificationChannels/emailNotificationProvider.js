import { API_BASE_URL, buildApiUrl, apiFetch } from "../../config/api";

export async function sendEmailNotification({ to, subject, html, text, notification }) {
  const safeTo = String(to ?? "").trim();
  if (!safeTo) {
    return { ok: false, skipped: true, reason: "missing_recipient_email" };
  }

  const providerConfigured = Boolean(import.meta.env.VITE_NOTIFICATIONS_EMAIL_PROVIDER);
  if (!providerConfigured || !API_BASE_URL) {
    if (import.meta.env.DEV) {
      console.info("[emailNotificationProvider] dry-run", {
        to_masked: safeTo.replace(/^(.{2}).+(@.+)$/, "$1***$2"),
        subject,
        notification_type: notification?.notification_type,
      });
    }
    return { ok: true, dryRun: true };
  }

  const url = buildApiUrl("/api/notifications/channels/email");
  if (!url) {
    return { ok: false, skipped: true, reason: "invalid_api_url" };
  }

  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      to: safeTo,
      subject,
      html: html ?? null,
      text: text ?? null,
      notification,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "email_send_failed" };
  }
  return { ok: true };
}


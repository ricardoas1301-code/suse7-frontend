// Copies de apresentação — canais da Central de Notificações (UI seller).

/** Descrição padrão do canal in_app nos cards de evento. */
export const NOTIFICATION_IN_APP_CHANNEL_DESCRIPTION = "Central de notificações";

/**
 * @param {Record<string, unknown> | null | undefined} channel
 */
export function applyNotificationChannelPresentation(channel) {
  if (!channel || typeof channel !== "object") return channel;
  if (String(channel.key) !== "in_app") return channel;
  return {
    ...channel,
    description: NOTIFICATION_IN_APP_CHANNEL_DESCRIPTION,
  };
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} channels
 */
export function applyNotificationChannelsPresentation(channels) {
  return (channels ?? []).map((ch) => applyNotificationChannelPresentation(ch));
}

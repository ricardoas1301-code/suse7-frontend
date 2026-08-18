// ======================================================
// HOOK: useCopyToClipboard
// Lógica centralizada de copy + flash + toast (padrão Raio-x)
// ======================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";

/** Timing oficial Suse7 para feedback de copy (ms) */
export const S7_COPY_OFFICIAL_FLASH_MS = 2000;

/**
 * @param {{ flashMs?: number }} [options]
 */
export function useCopyToClipboard(options = {}) {
  const flashMs = options.flashMs ?? S7_COPY_OFFICIAL_FLASH_MS;
  const { addNotification } = useNotifications();
  const [flashKey, setFlashKey] = useState(/** @type {string | null} */ (null));
  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearFlash = useCallback((key) => {
    setFlashKey((current) => (current === key ? null : current));
  }, []);

  /**
   * @param {{
   *   text: string | null | undefined;
   *   flashKey?: string;
   *   showToast?: boolean;
   *   toastLabel?: string;
   *   toastPreviewText?: string;
   *   toastEventType?: string;
   *   toastFailEventType?: string;
   *   toastEntityType?: string;
   * }} copyOptions
   * @returns {Promise<boolean>}
   */
  const copy = useCallback(
    async ({
      text,
      flashKey: key = "default",
      showToast = false,
      toastLabel = "Texto",
      toastPreviewText,
      toastEventType = "TEXT_COPIED",
      toastFailEventType = "TEXT_COPY_FAILED",
      toastEntityType = "generic",
    }) => {
      const t = String(text ?? "").trim();
      if (t === "") return false;

      try {
        await navigator.clipboard.writeText(t);

        if (timeoutRef.current != null) {
          clearTimeout(timeoutRef.current);
        }
        setFlashKey(key);
        timeoutRef.current = setTimeout(() => clearFlash(key), flashMs);

        if (showToast) {
          const preview =
            toastPreviewText != null && String(toastPreviewText).trim() !== ""
              ? String(toastPreviewText).trim()
              : t;
          addNotification({
            event_type: toastEventType,
            entity_type: toastEntityType,
            title: `${toastLabel} copiado`,
            message: `${preview} foi copiado para a área de transferência.`,
            severity: NOTIFICATION_SEVERITY.INFO,
          });
        }

        return true;
      } catch {
        if (showToast) {
          addNotification({
            event_type: toastFailEventType,
            entity_type: toastEntityType,
            title: "Não foi possível copiar",
            message: "Verifique permissões do navegador ou use HTTPS.",
            severity: NOTIFICATION_SEVERITY.WARNING,
          });
        }
        return false;
      }
    },
    [addNotification, clearFlash, flashMs],
  );

  const isFlashing = useCallback((key) => flashKey === key, [flashKey]);

  return {
    flashKey,
    copy,
    isFlashing,
    isFlashingAny: flashKey != null,
  };
}

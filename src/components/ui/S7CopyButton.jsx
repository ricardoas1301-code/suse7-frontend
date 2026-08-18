// ======================================================
// S7CopyButton — componente oficial global de copy (Suse7)
// Envolver texto + botão em <span className="s7-copy-group"> para hover reveal.
// Padrão visual oficial: iconMode="unicode" (⧉ / ✓), flashMs={2000}, showToast={true}
// ======================================================

import { useCallback } from "react";
import { S7_COPY_OFFICIAL_FLASH_MS, useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import S7Icon from "./S7Icon";
import S7Tooltip from "./S7Tooltip";
import "../Products.css";
import "./S7CopyButton.css";

/** Default de flash para consumidores legados (VendasPage, Precificação) até migração */
const S7_COPY_LEGACY_FLASH_MS = 1600;

/**
 * @param {{
 *   value: string | null | undefined;
 *   ariaLabel: string;
 *   tooltipText?: string;
 *   copiedTooltipText?: string;
 *   toastLabel?: string;
 *   toastPreviewText?: string;
 *   showToast?: boolean;
 *   toastEventType?: string;
 *   toastFailEventType?: string;
 *   toastEntityType?: string;
 *   iconMode?: "unicode" | "lucide";
 *   flashMs?: number;
 *   flashKey?: string;
 *   size?: number;
 *   className?: string;
 * }} props
 */
export default function S7CopyButton({
  value,
  ariaLabel,
  tooltipText = "Copiar",
  copiedTooltipText = "Copiado!",
  toastLabel,
  toastPreviewText,
  showToast = false,
  toastEventType,
  toastFailEventType,
  toastEntityType,
  iconMode = "lucide",
  flashMs = S7_COPY_LEGACY_FLASH_MS,
  flashKey = "s7-copy-button",
  size = 14,
  className = "",
}) {
  const { copy, isFlashing } = useCopyToClipboard({ flashMs });
  const flashing = isFlashing(flashKey);

  const handleClick = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const t = value != null ? String(value) : "";
      if (!t.trim()) return;

      const label =
        toastLabel != null && String(toastLabel).trim() !== ""
          ? String(toastLabel).trim()
          : ariaLabel.replace(/^Copiar\s+/i, "").trim() || "Texto";

      await copy({
        text: t,
        flashKey,
        showToast,
        toastLabel: label,
        toastPreviewText,
        toastEventType,
        toastFailEventType,
        toastEntityType,
      });
    },
    [value, copy, flashKey, showToast, toastLabel, toastPreviewText, toastEventType, toastFailEventType, toastEntityType, ariaLabel],
  );

  const tip = flashing ? copiedTooltipText : tooltipText;

  return (
    <S7Tooltip content={tip} placement="bottom-start" offset={6}>
      <button
        type="button"
        className={[
          "products-catalog__copy-btn",
          "s7-copy-btn",
          iconMode === "unicode" ? "s7-copy-btn--unicode" : "",
          flashing ? "products-catalog__copy-btn--ok" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel || "Copiar"}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClick}
      >
        {iconMode === "unicode" ? (
          <span className="s7-copy-btn__glyph" aria-hidden="true">
            {flashing ? "✓" : "⧉"}
          </span>
        ) : (
          <S7Icon name="copy" size={size} strokeWidth={2} />
        )}
      </button>
    </S7Tooltip>
  );
}

export { S7_COPY_OFFICIAL_FLASH_MS, S7_COPY_LEGACY_FLASH_MS };

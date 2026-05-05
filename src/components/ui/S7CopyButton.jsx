// ======================================================
// S7CopyButton — copiar com tooltip S7 (data-tip via S7Tooltip)
// Envolver texto + botão em <span className="s7-copy-group"> para hover revelar o ícone.
// ======================================================

import { useCallback, useState } from "react";
import S7Icon from "./S7Icon";
import S7Tooltip from "./S7Tooltip";
import "../Products.css";
import "./S7CopyButton.css";

/**
 * @param {{
 *   value: string | null | undefined;
 *   ariaLabel: string;
 *   tooltipText?: string;
 *   copiedTooltipText?: string;
 *   size?: number;
 *   className?: string;
 * }} props
 */
export default function S7CopyButton({
  value,
  ariaLabel,
  tooltipText = "Copiar",
  copiedTooltipText = "Copiado!",
  size = 14,
  className = "",
}) {
  const [flash, setFlash] = useState(false);

  const handleClick = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const t = value != null ? String(value) : "";
      if (!t.trim()) return;
      try {
        await navigator.clipboard.writeText(t);
        setFlash(true);
        window.setTimeout(() => setFlash(false), 1600);
      } catch {
        /* noop */
      }
    },
    [value],
  );

  const tip = flash ? copiedTooltipText : tooltipText;

  return (
    <S7Tooltip content={tip} placement="bottom-start" offset={6}>
      <button
        type="button"
        className={["products-catalog__copy-btn", "s7-copy-btn", flash ? "products-catalog__copy-btn--ok" : "", className]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel || "Copiar"}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClick}
      >
        <S7Icon name="copy" size={size} strokeWidth={2} />
      </button>
    </S7Tooltip>
  );
}

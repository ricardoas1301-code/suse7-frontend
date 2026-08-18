// ======================================================
// PI — Lápis reutilizável (mesmo padrão aba Precificação / Valor de venda).
// S4.3.6.9 — S7Tooltip no lápis habilitado (padrão Copiar SKU).
// S4.3.6.11 — desabilitado: sem tooltip, sem cursor proibido.
// ======================================================

import S7Tooltip from "../ui/S7Tooltip.jsx";

/**
 * @param {{
 *   ariaLabel: string;
 *   tooltip?: string | null;
 *   onClick: (event: import("react").MouseEvent<HTMLButtonElement>) => void;
 *   active?: boolean;
 *   disabled?: boolean;
 * }} props
 */
export function PromotionMiniCardPencilButton({
  ariaLabel,
  tooltip = null,
  onClick,
  active = false,
  disabled = false,
}) {
  const tip = tooltip != null && String(tooltip).trim() !== "" ? String(tooltip).trim() : ariaLabel;

  const botao = (
    <button
      type="button"
      className={[
        "pricing-inline-editable-metric__edit-btn",
        "pricing-intelligence-page__promotion-mini-card-pencil-btn",
        active ? "pricing-inline-editable-metric__edit-btn--active" : "",
        disabled ? "pricing-intelligence-page__promotion-mini-card-pencil-btn--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
      aria-disabled={disabled ? true : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </button>
  );

  if (disabled) {
    return (
      <span className="pricing-intelligence-page__promotion-mini-card-pencil-tooltip pricing-intelligence-page__promotion-mini-card-pencil-tooltip--disabled">
        {botao}
      </span>
    );
  }

  return (
    <S7Tooltip
      content={tip}
      placement="top-start"
      offset={6}
      wrap
      className="pricing-intelligence-page__promotion-mini-card-pencil-tooltip"
    >
      {botao}
    </S7Tooltip>
  );
}

/**
 * @param {{
 *   ariaLabel: string;
 *   tooltip?: string | null;
 *   onClick: (event: import("react").MouseEvent<HTMLButtonElement>) => void;
 * }} props
 */
export function PromotionMiniCardInlineActionButton({ ariaLabel, tooltip = null, onClick }) {
  const tip = tooltip != null && String(tooltip).trim() !== "" ? String(tooltip).trim() : ariaLabel;

  return (
    <S7Tooltip
      content={tip}
      placement="top-start"
      offset={6}
      wrap
      className="pricing-intelligence-page__promotion-mini-card-inline-action-tooltip"
    >
      <button
        type="button"
        className="pricing-intelligence-page__promotion-mini-card-inline-action pricing-intelligence-page__promotion-mini-card-inline-action--confirm"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
    </S7Tooltip>
  );
}

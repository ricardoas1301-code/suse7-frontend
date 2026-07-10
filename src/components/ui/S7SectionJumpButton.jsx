// ======================================================================
// Botão de navegação vertical — bloco executivo ↔ busca e filtros.
// ======================================================================

import { useCallback } from "react";
import { scrollToSectionElement } from "../../utils/s7SectionScroll.js";
import sectionJumpDownIcon from "../../assets/s7-section-jump-down.png";
import sectionJumpUpIcon from "../../assets/s7-section-jump-up.png";
import "./S7SectionJumpButton.css";

/**
 * @param {{
 *   direction?: "up" | "down";
 *   targetRef?: import("react").RefObject<Element | null>;
 *   onClick?: (event: import("react").MouseEvent<HTMLElement>) => void;
 *   ariaLabel?: string;
 *   title?: string;
 *   className?: string;
 *   element?: "button" | "span";
 * }} props
 */
export default function S7SectionJumpButton({
  direction = "down",
  targetRef,
  onClick,
  ariaLabel,
  title,
  className = "",
  element = "button",
}) {
  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (onClick) {
        onClick(event);
        return;
      }
      const target = targetRef?.current;
      if (target) scrollToSectionElement(target);
    },
    [onClick, targetRef],
  );

  const icon = direction === "up" ? sectionJumpUpIcon : sectionJumpDownIcon;
  const defaultLabel =
    direction === "up" ? "Voltar para o resumo da página" : "Ir para busca e filtros";
  const isSpan = element === "span";

  const handleKeyDown = useCallback(
    (event) => {
      if (!isSpan) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        handleClick(/** @type {import("react").MouseEvent<HTMLElement>} */ (event));
      }
    },
    [handleClick, isSpan],
  );

  const classNames = [
    "s7-section-jump-button",
    `s7-section-jump-button--${direction}`,
    isSpan ? "s7-section-jump-button--inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isSpan) {
    return (
      <span
        role="button"
        tabIndex={0}
        className={classNames}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel ?? defaultLabel}
        title={title ?? ariaLabel ?? defaultLabel}
      >
        <img src={icon} alt="" aria-hidden className="s7-section-jump-button__icon" />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classNames}
      onClick={handleClick}
      aria-label={ariaLabel ?? defaultLabel}
      title={title ?? ariaLabel ?? defaultLabel}
    >
      <img src={icon} alt="" aria-hidden className="s7-section-jump-button__icon" />
    </button>
  );
}

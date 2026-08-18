// ======================================================================
// Botão de navegação vertical — bloco executivo ↔ busca e filtros.
// ======================================================================

import { useCallback } from "react";
import { scrollToSectionElement } from "../../utils/s7SectionScroll.js";
import sectionJumpDownIcon from "../../assets/s7-section-jump-down.png";
import sectionJumpUpIcon from "../../assets/s7-section-jump-up.png";
import S7Tooltip from "./S7Tooltip";
import "./S7SectionJumpButton.css";

/**
 * @param {{
 *   direction?: "up" | "down";
 *   targetRef?: import("react").RefObject<Element | null>;
 *   onClick?: (event: import("react").MouseEvent<HTMLElement>) => void;
 *   ariaLabel?: string;
 *   className?: string;
 *   element?: "button" | "span";
 * }} props
 */
export default function S7SectionJumpButton({
  direction = "down",
  targetRef,
  onClick,
  ariaLabel,
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
    direction === "up" ? "Voltar para o Top 10" : "Ir para busca e filtros";
  const tooltipLabel = ariaLabel ?? defaultLabel;
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

  const control = isSpan ? (
    <span
      role="button"
      tabIndex={0}
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={tooltipLabel}
    >
      <img src={icon} alt="" aria-hidden className="s7-section-jump-button__icon" />
    </span>
  ) : (
    <button type="button" className={classNames} onClick={handleClick} aria-label={tooltipLabel}>
      <img src={icon} alt="" aria-hidden className="s7-section-jump-button__icon" />
    </button>
  );

  return (
    <S7Tooltip content={tooltipLabel} placement="top-start" offset={6}>
      {control}
    </S7Tooltip>
  );
}

// ======================================================
// COMPONENTE GLOBAL: S7Tooltip
// Objetivo:
// - Tooltip único do Design System (Suse7)
// - Reutiliza o padrão global .s7-tip + data-tip (hover)
// - API consistente: placement, offset, conteúdo
//
// Observações:
// - Padrão oficial: placement="bottom-start", offset={6}
// - Sem lógica de negócio; apenas composição visual
// ======================================================

import { cloneElement, isValidElement } from "react";

import "./S7Tooltip.css";

/** @param {import("react").ReactNode} props.children */
export default function S7Tooltip({
  /** Texto exibido no tooltip */
  content = "",
  children,
  /** @type {"bottom-start"} */
  placement = "bottom-start",
  offset = 6,
  /** Permite quebra de linha em textos longos (.s7-tip-wrap) */
  wrap = false,
  className = "",
}) {
  if (!content) {
    return children ?? null;
  }

  const placementClass =
    placement === "bottom-start" ? "s7-tooltip--bottom-start" : "";

  const mergedClass = [
    "s7-tooltip",
    "s7-tip",
    "s7-tip-bottom",
    "s7-tip-left",
    wrap ? "s7-tip-wrap" : "",
    placementClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = { "--s7-tooltip-offset": `${offset}px` };

  if (isValidElement(children)) {
    return cloneElement(children, {
      "data-tip": content,
      className: [mergedClass, children.props.className].filter(Boolean).join(" "),
      style: { ...(children.props.style || {}), ...style },
    });
  }

  return (
    <span className={mergedClass} data-tip={content} style={style}>
      {children}
    </span>
  );
}

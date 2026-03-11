// ======================================================
// COMPONENTE GLOBAL: S7Tooltip
// Objetivo:
// - Padronizar tooltips do Suse7
// - Substituir tooltips manuais do sistema
// - Comportamento: hover e focus
//
// Observações:
// - Sem lógica de negócio
// - Componente visual e reutilizável
// ======================================================

import { useState, useRef, useEffect } from "react";
import "./S7Tooltip.css";

export default function S7Tooltip({
  content = "",
  position = "right",
  children,
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef(null);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // Esconde ao pressionar Escape
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  const wrapperClasses = [
    "s7-tooltip",
    visible ? "s7-tooltip--visible" : "",
    `s7-tooltip--${position}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      ref={wrapperRef}
      className={wrapperClasses}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      <span className="s7-tooltip__trigger">{children}</span>
      {content ? (
        <span className="s7-tooltip__bubble" role="tooltip">
          {content}
        </span>
      ) : null}
    </span>
  );
}

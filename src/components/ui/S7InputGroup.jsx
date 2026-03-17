// ======================================================================
// S7InputGroup
// Agrupa inputs e botões em uma mesma linha.
// - Ex: [ input SKU ] [ botão Gerar ] [ botão Copiar ]
// - Responsável apenas pelo layout flex.
// ======================================================================

import "./S7InputGroup.css";

export default function S7InputGroup({ children, align = "center", gap = 6 }) {
  const alignClass =
    align === "start" ? "s7-input-group--start" :
    align === "end" ? "s7-input-group--end" :
    "s7-input-group--center";

  return (
    <div
      className={`s7-input-group ${alignClass}`}
      style={{ "--s7-input-group-gap": `${gap}px` }}
    >
      {children}
    </div>
  );
}


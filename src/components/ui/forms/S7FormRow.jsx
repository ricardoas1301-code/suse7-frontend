// ======================================================
// COMPONENTE GLOBAL: S7FormRow
// Objetivo:
// - Layout oficial em grid para linhas de formulário (Suse7)
// - Colunas iguais (1–4), track customizado via string, gap e alinhamento
// - Empilhamento em viewports estreitas (opcional)
//
// Observações:
// - Sem regra de negócio; apenas layout
// - Pensado para compor com S7FormField, S7Input, S7Select, etc.
// ======================================================

import "./S7FormRow.css";

/** Gap padrão quando `gap` não é informado (alinhado ao DS). */
const DEFAULT_GAP = "16px";

const ALIGN_MAP = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch",
};

/**
 * @param {number | string} columns
 * @returns {string} valor para grid-template-columns
 */
function resolveTemplateColumns(columns) {
  if (typeof columns === "number") {
    const n = Math.min(Math.max(Math.floor(columns), 1), 4);
    return `repeat(${n}, minmax(0, 1fr))`;
  }
  if (typeof columns === "string" && columns.trim() !== "") {
    return columns.trim();
  }
  return "repeat(2, minmax(0, 1fr))";
}

export default function S7FormRow({
  columns = 2,
  gap,
  className = "",
  stackOnMobile = true,
  align = "start",
  children,
}) {
  const resolvedCols = resolveTemplateColumns(columns);
  const gapValue =
    gap != null && String(gap).trim() !== "" ? String(gap).trim() : DEFAULT_GAP;
  const alignValue = ALIGN_MAP[align] ?? "start";

  const rootClass = [
    "s7-form-row",
    stackOnMobile ? "s7-form-row--stack-mobile" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  /** Variáveis CSS: colunas desktop + gap + alinhamento (stack usa media query). */
  const style = {
    "--s7-form-row-columns": resolvedCols,
    "--s7-form-row-gap": gapValue,
    "--s7-form-row-align": alignValue,
  };

  return (
    <div className={rootClass} style={style}>
      {children}
    </div>
  );
}

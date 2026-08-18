/**
 * Monta classes explícitas do S7 Operational Row Card (grid).
 * @param {string[]} baseClasses
 * @param {{ selected?: boolean; critical?: boolean }} [state]
 */
export function montarClassesLinhaOperationalRowCard(baseClasses, state = {}) {
  const { selected = false, critical = false } = state;
  return [
    ...baseClasses,
    "s7-operational-row-card",
    critical && "s7-operational-row-card--critical",
    selected && "s7-operational-row-card--selected",
  ]
    .filter(Boolean)
    .join(" ");
}

export const S7_OPERATIONAL_ROW_CARD_STACK = "s7-operational-row-card-stack";
export const S7_OPERATIONAL_ROW_CARD_VIEWPORT = "s7-operational-row-card-viewport";
export const S7_OPERATIONAL_ROW_CARD_TABLE = "s7-operational-row-card-table";
export const S7_OPERATIONAL_ROW_CARD_TABLE_ROW = "s7-operational-row-card-table-row";

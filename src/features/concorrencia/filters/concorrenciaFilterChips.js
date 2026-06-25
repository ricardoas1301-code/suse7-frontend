// ======================================================================
// Chips de filtros rápidos — página Concorrência.
// ======================================================================

import { CONCORRENCIA_LIMITE_CONCORRENTES } from "./concorrenciaFiltersConstants.js";
import { produtoTemConcorrenteInativo } from "../../../components/concorrencia/concorrenciaCompetitorDisplay.js";

export const CONCORRENCIA_FILTER_CHIPS = [
  { id: "all", label: "Todos", icon: "catalog_filter_all", iconTone: "neutral", match: () => true },
  { id: "with", label: "Com concorrentes", icon: "monitoring", iconTone: "mkp", match: (count) => count > 0 },
  { id: "without", label: "Sem concorrentes", icon: "catalog_filter_no_sales", iconTone: "slate", match: (count) => count === 0 },
  {
    id: "complete",
    label: "Concorrência completa",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    match: (count) => count >= CONCORRENCIA_LIMITE_CONCORRENTES,
  },
  {
    id: "incomplete",
    label: "Concorrência incompleta",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    match: (count) => count > 0 && count < CONCORRENCIA_LIMITE_CONCORRENTES,
  },
  {
    id: "inactive_competitors",
    label: "Concorrentes inativos",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    matchProduct: ({ competitors, count }) =>
      count > 0 && produtoTemConcorrenteInativo(competitors),
  },
];

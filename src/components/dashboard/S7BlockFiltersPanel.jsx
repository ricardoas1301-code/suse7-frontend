// ======================================================================
// Painel recolhível de filtros por bloco — Dashboard (período + conta).
// ======================================================================

import VendasPeriodRangePicker from "../../features/vendas/filters/VendasPeriodRangePicker";
import { S7AccountSelect } from "../searchFilters";
import "../../features/vendas/filters/VendasFiltersCard.css";
import "./S7BlockFiltersPanel.css";

/**
 * @param {{
 *   idPrefix: string;
 *   expanded: boolean;
 *   periodPreset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi | "operational_cycle";
 *   startDate: string;
 *   endDate: string;
 *   marketplaceAccountId: string;
 *   accounts?: readonly Record<string, unknown>[];
 *   accountLabel: (account: Record<string, unknown>) => string;
 *   accountsReady?: boolean;
 *   onApplyPeriod: (payload: {
 *     preset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi | "operational_cycle";
 *     startDate: string;
 *     endDate: string;
 *   }) => void;
 *   onAccountChange: (accountId: string) => void;
 *   layout?: "collapsible" | "inline";
 *   triggerLabelOverride?: string | null;
 *   periodPresets?: readonly { id: string; label: string }[];
 * }} props
 */
export default function S7BlockFiltersPanel({
  idPrefix,
  expanded,
  periodPreset,
  startDate,
  endDate,
  marketplaceAccountId,
  accounts = [],
  accountLabel,
  accountsReady = true,
  onApplyPeriod,
  onAccountChange,
  layout = "collapsible",
  triggerLabelOverride = null,
  periodPresets,
}) {
  const isInline = layout === "inline";
  const isExpanded = isInline || expanded;

  const panelBody = (
    <div className="s7-block-filters-panel__body vendas-filters-card__body">
      <div
        className={[
          "s7-block-filters-panel__filters-row",
          "vendas-filters-card__row",
          "vendas-filters-card__row--primary",
          isInline ? "s7-block-filters-panel__filters-row--inline" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="s7-block-filters-panel__field s7-block-filters-panel__field--period vendas-filters-card__field vendas-filters-card__field--period">
          <VendasPeriodRangePicker
            periodPreset={periodPreset}
            startDate={startDate}
            endDate={endDate}
            onApply={onApplyPeriod}
            showFieldLabel={!isInline}
            triggerLabelOverride={triggerLabelOverride}
            {...(periodPresets ? { presets: periodPresets } : {})}
          />
        </div>

        <div className="s7-block-filters-panel__field s7-block-filters-panel__field--account vendas-filters-card__field vendas-filters-card__field--account">
          <S7AccountSelect
            id={`${idPrefix}-account`}
            accounts={accounts}
            value={marketplaceAccountId}
            onChange={onAccountChange}
            disabled={!accountsReady}
            accountLabel={accountLabel}
          />
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="s7-block-filters-panel s7-block-filters-panel--inline" id={`${idPrefix}-filters-panel`}>
        {panelBody}
      </div>
    );
  }

  return (
    <div
      id={`${idPrefix}-filters-panel`}
      className={[
        "s7-block-filters-panel",
        isExpanded ? "s7-block-filters-panel--expanded" : "s7-block-filters-panel--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isExpanded}
    >
      {panelBody}
    </div>
  );
}

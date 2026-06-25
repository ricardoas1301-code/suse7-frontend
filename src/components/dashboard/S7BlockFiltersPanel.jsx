// ======================================================================
// Painel recolhível de filtros por bloco — Dashboard (período + conta).
// ======================================================================

import VendasPeriodRangePicker from "../../features/vendas/filters/VendasPeriodRangePicker";
import "../../features/vendas/filters/VendasFiltersCard.css";
import "./S7BlockFiltersPanel.css";

/**
 * @param {{
 *   idPrefix: string;
 *   expanded: boolean;
 *   periodPreset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplaceAccountId: string;
 *   accounts?: readonly Record<string, unknown>[];
 *   accountLabel: (account: Record<string, unknown>) => string;
 *   accountsReady?: boolean;
 *   onApplyPeriod: (payload: { preset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi; startDate: string; endDate: string }) => void;
 *   onAccountChange: (accountId: string) => void;
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
}) {
  return (
    <div
      id={`${idPrefix}-filters-panel`}
      className={[
        "s7-block-filters-panel",
        expanded ? "s7-block-filters-panel--expanded" : "s7-block-filters-panel--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!expanded}
    >
      <div className="s7-block-filters-panel__body vendas-filters-card__body">
        <div className="vendas-filters-card__row vendas-filters-card__row--primary dashboard-filters-card__row--executive">
          <div className="vendas-filters-card__field vendas-filters-card__field--period">
            <VendasPeriodRangePicker
              periodPreset={periodPreset}
              startDate={startDate}
              endDate={endDate}
              onApply={onApplyPeriod}
            />
          </div>

          <div className="vendas-filters-card__selects">
            <div className="vendas-filters-card__field vendas-filters-card__field--account">
              <label className="vendas-filters-card__label" htmlFor={`${idPrefix}-account`}>
                Conta
              </label>
              <select
                id={`${idPrefix}-account`}
                className="vendas-filters-card__select"
                value={marketplaceAccountId}
                disabled={!accountsReady}
                onChange={(e) => onAccountChange(e.target.value)}
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => {
                  const id = a.id != null ? String(a.id).trim() : "";
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {accountLabel(a)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

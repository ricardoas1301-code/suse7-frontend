import S7Input from "../../../components/ui/S7Input";
import { S7Button } from "../../../components/ui";
import {
  BILLING_FLAG_OPTIONS,
  BILLING_STATUS_OPTIONS,
  FINANCIAL_HEALTH_OPTIONS,
  RENEWAL_FILTER_OPTIONS,
} from "./subscriptionOpsConstants";

const EMPTY = "";

/**
 * @param {{
 *   filters: import('./subscriptionOpsTypes').SubscriptionFilters;
 *   planOptions: string[];
 *   onChange: (patch: Partial<import('./subscriptionOpsTypes').SubscriptionFilters>) => void;
 *   onReset: () => void;
 * }} props
 */
export default function SubscriptionOpsFilters({ filters, planOptions, onChange, onReset }) {
  return (
    <div className="dc-sub-filters">
      <div className="dc-sub-filters__search">
        <S7Input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar seller, email ou assinatura"
        />
      </div>
      <div className="dc-sub-filters__grid">
        <label className="dc-sub-filters__field">
          <span>Status billing</span>
          <select value={filters.billing_status} onChange={(e) => onChange({ billing_status: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {BILLING_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sub-filters__field">
          <span>Plano</span>
          <select value={filters.plan} onChange={(e) => onChange({ plan: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {planOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sub-filters__field">
          <span>Flag billing</span>
          <select value={filters.billing_flag} onChange={(e) => onChange({ billing_flag: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {BILLING_FLAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sub-filters__field">
          <span>Health financeiro</span>
          <select value={filters.health} onChange={(e) => onChange({ health: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {FINANCIAL_HEALTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sub-filters__field">
          <span>Renovação</span>
          <select value={filters.renewal} onChange={(e) => onChange({ renewal: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {RENEWAL_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dc-sub-filters__actions">
        <S7Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Limpar filtros
        </S7Button>
      </div>
    </div>
  );
}

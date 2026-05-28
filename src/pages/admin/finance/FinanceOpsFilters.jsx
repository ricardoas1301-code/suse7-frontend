import S7Input from "../../../components/ui/S7Input";
import { S7Button } from "../../../components/ui";
import {
  BILLING_FLAG_OPTIONS,
  FINANCIAL_HEALTH_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  RENEWAL_FILTER_OPTIONS,
} from "./financeOpsConstants";

const EMPTY = "";

/**
 * @param {{
 *   filters: import('./financeOpsTypes').FinanceFilters;
 *   planOptions: string[];
 *   onChange: (patch: Partial<import('./financeOpsTypes').FinanceFilters>) => void;
 *   onReset: () => void;
 * }} props
 */
export default function FinanceOpsFilters({ filters, planOptions, onChange, onReset }) {
  return (
    <div className="dc-fin-filters">
      <div className="dc-fin-filters__search">
        <S7Input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar seller, email ou assinatura"
        />
      </div>
      <div className="dc-fin-filters__grid">
        <label className="dc-fin-filters__field">
          <span>Status pagamento</span>
          <select value={filters.payment_status} onChange={(e) => onChange({ payment_status: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-fin-filters__field">
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
        <label className="dc-fin-filters__field">
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
        <label className="dc-fin-filters__field">
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
        <label className="dc-fin-filters__field">
          <span>Método</span>
          <select value={filters.payment_method} onChange={(e) => onChange({ payment_method: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {PAYMENT_METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-fin-filters__field">
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
      <div className="dc-fin-filters__actions">
        <S7Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Limpar filtros
        </S7Button>
      </div>
    </div>
  );
}

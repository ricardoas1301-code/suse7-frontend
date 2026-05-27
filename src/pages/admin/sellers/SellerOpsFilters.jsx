import S7Input from "../../../components/ui/S7Input";
import { S7Button } from "../../../components/ui";
import {
  SELLER_BILLING_OPTIONS,
  SELLER_HEALTH_OPTIONS,
  SELLER_INTEGRATION_OPTIONS,
  SELLER_STATUS_OPTIONS,
} from "./sellerOpsConstants";

const EMPTY = "";

/**
 * @param {{
 *   filters: import('./sellerOpsTypes').SellerFilters;
 *   planOptions: string[];
 *   onChange: (patch: Partial<import('./sellerOpsTypes').SellerFilters>) => void;
 *   onReset: () => void;
 * }} props
 */
export default function SellerOpsFilters({ filters, planOptions, onChange, onReset }) {
  return (
    <div className="dc-sellers-filters">
      <div className="dc-sellers-filters__search">
        <S7Input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar seller, email ou ID"
        />
      </div>
      <div className="dc-sellers-filters__grid">
        <label className="dc-sellers-filters__field">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {SELLER_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sellers-filters__field">
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
        <label className="dc-sellers-filters__field">
          <span>Integração</span>
          <select value={filters.integration} onChange={(e) => onChange({ integration: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {SELLER_INTEGRATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sellers-filters__field">
          <span>Assinatura</span>
          <select value={filters.billing} onChange={(e) => onChange({ billing: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {SELLER_BILLING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-sellers-filters__field">
          <span>Health</span>
          <select value={filters.health} onChange={(e) => onChange({ health: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {SELLER_HEALTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dc-sellers-filters__actions">
        <S7Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Limpar filtros
        </S7Button>
      </div>
    </div>
  );
}

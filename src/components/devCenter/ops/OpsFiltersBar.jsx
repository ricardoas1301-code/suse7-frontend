import S7Input from "../../ui/S7Input";
import "./ops.css";

const STATUS_OPTIONS = [
  { value: "", label: "Status" },
  { value: "ativo", label: "Ativo" },
  { value: "recorrente", label: "Recorrente" },
  { value: "novo", label: "Novo" },
  { value: "inativo", label: "Inativo" },
  { value: "dados incompletos", label: "Dados incompletos" },
];

/**
 * Filtros ops — scope "global" (Dev Center) ou "seller" (Clientes360 futuro).
 * @param {{
 *   q: string;
 *   onQChange: (v: string) => void;
 *   scope?: "seller" | "global";
 *   marketplace?: string;
 *   onMarketplaceChange?: (v: string) => void;
 *   marketplaceAccountId?: string;
 *   onMarketplaceAccountIdChange?: (v: string) => void;
 *   sellerCompanyId?: string;
 *   onSellerCompanyIdChange?: (v: string) => void;
 *   customerStatus?: string;
 *   onCustomerStatusChange?: (v: string) => void;
 *   marketplaceOptions?: Array<{ value: string; label: string }>;
 * }} props
 */
export default function OpsFiltersBar({
  q,
  onQChange,
  scope = "seller",
  marketplace = "",
  onMarketplaceChange = () => {},
  marketplaceAccountId = "",
  onMarketplaceAccountIdChange = () => {},
  sellerCompanyId = "",
  onSellerCompanyIdChange = () => {},
  customerStatus = "",
  onCustomerStatusChange = () => {},
  marketplaceOptions = [],
}) {
  const isGlobal = scope === "global";

  return (
    <section className="ops-filters" aria-label="Filtros">
      <div className="ops-filters__row">
        <S7Input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder={
            isGlobal
              ? "Buscar por nome, documento, e-mail ou telefone (mascarados na listagem)"
              : "Buscar cliente, documento, e-mail ou cidade"
          }
          className="ops-filters__search"
        />
      </div>
      {!isGlobal ? (
        <div className="ops-filters__row ops-filters__row--controls">
        <select value={marketplace} onChange={(e) => onMarketplaceChange(e.target.value)} aria-label="Marketplace">
          <option value="">Marketplace</option>
          {marketplaceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {marketplaceOptions.length === 0 ? (
            <>
              <option value="mercado_livre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
            </>
          ) : null}
        </select>
        <S7Input
          value={marketplaceAccountId}
          onChange={(e) => onMarketplaceAccountIdChange(e.target.value)}
          placeholder="Conta marketplace (UUID)"
          className="ops-filters__compact"
        />
        <S7Input
          value={sellerCompanyId}
          onChange={(e) => onSellerCompanyIdChange(e.target.value)}
          placeholder="Empresa (UUID)"
          className="ops-filters__compact"
        />
        <select value={customerStatus} onChange={(e) => onCustomerStatusChange(e.target.value)} aria-label="Status">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      ) : null}
    </section>
  );
}

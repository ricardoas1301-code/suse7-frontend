import { memo, useCallback } from "react";
import SellerOpsOpenButton from "./SellerOpsOpenButton";
import {
  formatMarketplacesSummary,
  formatPlanDisplay,
  formatSellerWhen,
  healthClass,
  healthLabel,
  statusClass,
} from "./sellerOpsUtils";

const ROW_ACTION_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="menuitem"], [data-row-action]';

/**
 * @param {Event | React.SyntheticEvent} event
 */
function shouldIgnoreRowActivation(event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(ROW_ACTION_SELECTOR));
}

/**
 * @param {{
 *   seller: import('./sellerOpsTypes').SellerListRow;
 *   isSelected: boolean;
 *   drawerPhase: "idle" | "loading" | "ok" | "error";
 *   onOpen: (seller: import('./sellerOpsTypes').SellerListRow, source: "row" | "button") => void;
 * }} props
 */
const SellerOpsQueueRow = memo(function SellerOpsQueueRow({ seller, isSelected, drawerPhase, onOpen }) {
  const ariaLabel = `Abrir seller ${seller.nome}`;

  const openFromRow = useCallback(() => {
    onOpen(seller, "row");
  }, [onOpen, seller]);

  const handleRowClick = useCallback(
    (event) => {
      if (shouldIgnoreRowActivation(event)) return;
      openFromRow();
    },
    [openFromRow],
  );

  const handleRowKeyDown = useCallback(
    (event) => {
      if (shouldIgnoreRowActivation(event)) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFromRow();
      }
    },
    [openFromRow],
  );

  const handleActionsCellPointer = useCallback((event) => {
    event.stopPropagation();
  }, []);

  return (
    <tr
      className={[
        "dc-sellers-queue__row",
        "dc-sellers-queue__row--interactive",
        isSelected ? "dc-sellers-queue__row--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
    >
      <td>
        <div className="dc-sellers-queue__seller">
          {seller.photo_url ? (
            <img src={seller.photo_url} alt="" className="dc-sellers-queue__avatar" />
          ) : (
            <span className="dc-sellers-queue__avatar dc-sellers-queue__avatar--placeholder" aria-hidden>
              {(seller.nome || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <strong>{seller.nome}</strong>
            <span>{seller.email}</span>
            {seller.in_grace || seller.is_past_due ? (
              <span className="dc-sellers-queue__flag">
                {seller.in_grace ? "Grace" : null}
                {seller.is_past_due ? "Inadimplente" : null}
              </span>
            ) : null}
          </div>
        </div>
      </td>
      <td>{formatPlanDisplay(seller.plan_key, seller.plano)}</td>
      <td>
        <span className={statusClass(seller.status)}>{seller.status}</span>
      </td>
      <td>
        <span className={healthClass(seller.operational_health)}>{healthLabel(seller.operational_health)}</span>
      </td>
      <td>
        <div className="dc-sellers-queue__integrations">
          <strong>{seller.connected_accounts}</strong>
          <span>{formatMarketplacesSummary(seller.marketplaces)}</span>
        </div>
      </td>
      <td>{seller.companies_count}</td>
      <td>{seller.listings_count}</td>
      <td>{seller.sales_recent_30d}</td>
      <td className="dc-sellers-queue__when">{formatSellerWhen(seller.last_access_at)}</td>
      <td
        className="dc-table__actions dc-sellers-queue__actions"
        data-row-action
        onClick={handleActionsCellPointer}
        onKeyDown={handleActionsCellPointer}
      >
        <SellerOpsOpenButton
          seller={seller}
          isSelected={isSelected}
          drawerPhase={isSelected ? drawerPhase : "idle"}
          onOpen={onOpen}
        />
      </td>
    </tr>
  );
});

/**
 * @param {{
 *   sellers: import('./sellerOpsTypes').SellerListRow[];
 *   selectedId?: string | null;
 *   drawerPhase?: "idle" | "loading" | "ok" | "error";
 *   onOpen: (seller: import('./sellerOpsTypes').SellerListRow, source: "row" | "button") => void;
 * }} props
 */
export default function SellerOpsQueue({ sellers, selectedId = null, drawerPhase = "idle", onOpen }) {
  return (
    <div className="dc-table-wrap dc-sellers-queue">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Health</th>
            <th>Integrações</th>
            <th>Empresas</th>
            <th>Anúncios</th>
            <th>Vendas (30d)</th>
            <th>Último acesso</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sellers.length === 0 ? (
            <tr>
              <td colSpan={10}>Nenhum seller encontrado com os filtros atuais.</td>
            </tr>
          ) : (
            sellers.map((seller) => (
              <SellerOpsQueueRow
                key={seller.id}
                seller={seller}
                isSelected={selectedId === seller.id}
                drawerPhase={drawerPhase}
                onOpen={onOpen}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {{ rows?: number }} props
 */
export function SellerOpsQueueSkeleton({ rows = 6 }) {
  return (
    <div className="dc-table-wrap dc-sellers-queue dc-sellers-queue--loading">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Health</th>
            <th>Integrações</th>
            <th>Empresas</th>
            <th>Anúncios</th>
            <th>Vendas (30d)</th>
            <th>Último acesso</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td colSpan={10}>
                <div className="dc-sellers-skeleton" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { memo } from "react";
import { sellerDrawerBadgeClassName } from "./sellerDrawerHeaderModel";

/**
 * @param {{
 *   badges: import("./sellerDrawerHeaderModel").SellerDrawerHeaderModel["badges"];
 *   loading?: boolean;
 *   error?: string | null;
 * }} props
 */
function SellerDrawerHeaderStatus({ badges, loading = false, error = null }) {
  if (loading) {
    return (
      <div className="seller-drawer-header__status" aria-busy="true" aria-label="Carregando estado do seller">
        <div className="seller-drawer-header__badges">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="seller-drawer-header__badge seller-drawer-header__badge--skeleton"
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="seller-drawer-header__status">
      {error ? (
        <p className="seller-drawer-header__status-error" role="status">
          Não foi possível atualizar o estado completo.
        </p>
      ) : null}
      <div className="seller-drawer-header__badges" aria-label="Estado operacional do seller">
        {badges.length === 0 ? (
          <span className={sellerDrawerBadgeClassName("muted")}>Sem dados de estado</span>
        ) : (
          badges.map((badge) => (
            <span
              key={badge.key}
              className={badge.className ?? sellerDrawerBadgeClassName(badge.tone)}
              title={badge.label}
            >
              {badge.label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(SellerDrawerHeaderStatus);

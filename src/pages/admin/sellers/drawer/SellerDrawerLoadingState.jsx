import { memo } from "react";

function SellerDrawerLoadingState() {
  return (
    <div className="seller-drawer-state seller-drawer-state--loading drawer-loading" role="status" aria-live="polite">
      <p className="seller-drawer-state__hint">Carregando ficha do seller…</p>
      <div className="seller-drawer-state__skeleton-stack" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="seller-drawer-state__skeleton-card">
            <span className="seller-drawer-state__skeleton-line seller-drawer-state__skeleton-line--title" />
            <span className="seller-drawer-state__skeleton-line" />
            <span className="seller-drawer-state__skeleton-line seller-drawer-state__skeleton-line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(SellerDrawerLoadingState);

import { memo } from "react";

/**
 * @param {{
 *   lines?: number;
 *   dense?: boolean;
 * }} props
 */
export function SellerDrawerSectionSkeleton({ lines = 3, dense = false }) {
  return (
    <div className={`seller-drawer-section__skeleton${dense ? " seller-drawer-section__skeleton--dense" : ""}`} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className="seller-drawer-section__skeleton-line" />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   subtitle?: string | null;
 *   state?: "loading" | "loaded" | "empty" | "error";
 *   emptyMessage?: string;
 *   errorMessage?: string;
 *   className?: string;
 *   children?: import("react").ReactNode;
 * }} props
 */
function SellerDrawerSection({
  title,
  subtitle = null,
  state = "loaded",
  emptyMessage = "Sem dados disponíveis.",
  errorMessage = "Não foi possível carregar este bloco.",
  className = "",
  children,
}) {
  return (
    <section className={["seller-drawer-section", className].filter(Boolean).join(" ")} data-state={state}>
      <header className="seller-drawer-section__head">
        <div className="seller-drawer-section__titles">
          <h4 className="seller-drawer-section__title">{title}</h4>
          {subtitle ? <p className="seller-drawer-section__subtitle">{subtitle}</p> : null}
        </div>
      </header>

      <div className="seller-drawer-section__body">
        {state === "loading" ? <SellerDrawerSectionSkeleton /> : null}
        {state === "empty" ? <p className="seller-drawer-section__empty">{emptyMessage}</p> : null}
        {state === "error" ? <p className="seller-drawer-section__error">{errorMessage}</p> : null}
        {state === "loaded" ? children : null}
      </div>
    </section>
  );
}

export default memo(SellerDrawerSection);

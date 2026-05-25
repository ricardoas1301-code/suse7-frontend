import { S7Button } from "../../ui";
import "./ops.css";

/**
 * @param {{
 *   open: boolean;
 *   title: string;
 *   subtitle?: string | null;
 *   freshnessLabel?: string | null;
 *   revalidating?: boolean;
 *   onClose: () => void;
 *   children: import("react").ReactNode;
 *   loading?: boolean;
 * }} props
 */
export default function OpsDrawerShell({
  open,
  title,
  subtitle,
  freshnessLabel = null,
  revalidating = false,
  onClose,
  children,
  loading = false,
}) {
  if (!open) return null;

  const showSkeleton = loading && !revalidating;

  return (
    <div className="ops-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="ops-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-drawer-title"
      >
        <header className="ops-drawer__head">
          <div>
            <h2 id="ops-drawer-title">{title}</h2>
            {subtitle ? <p className="ops-drawer__subtitle">{subtitle}</p> : null}
            {freshnessLabel ? (
              <p
                className={`ops-drawer__freshness${revalidating ? " ops-drawer__freshness--busy" : ""}${
                  freshnessLabel === "Pode estar desatualizado" ? " ops-drawer__freshness--warn" : ""
                }`}
              >
                {freshnessLabel}
              </p>
            ) : null}
          </div>
          <S7Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </S7Button>
        </header>
        <div className="ops-drawer__body">
          {showSkeleton ? <div className="ops-drawer__skeleton" aria-hidden="true" /> : children}
        </div>
      </aside>
    </div>
  );
}

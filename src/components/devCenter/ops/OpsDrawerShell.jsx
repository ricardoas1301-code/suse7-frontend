import { S7Button } from "../../ui";
import "./ops.css";

/**
 * @param {{ open: boolean; title: string; subtitle?: string | null; onClose: () => void; children: import("react").ReactNode; loading?: boolean }} props
 */
export default function OpsDrawerShell({ open, title, subtitle, onClose, children, loading = false }) {
  if (!open) return null;

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
          </div>
          <S7Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </S7Button>
        </header>
        <div className="ops-drawer__body">
          {loading ? <div className="ops-drawer__skeleton" aria-hidden="true" /> : children}
        </div>
      </aside>
    </div>
  );
}

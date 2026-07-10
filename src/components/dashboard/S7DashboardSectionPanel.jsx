// ======================================================================
// Card pai — seções do Dashboard (Top 10, Central de Saúde, etc.)
// Somente moldura visual; conteúdo interno permanece inalterado.
// ======================================================================

import "./S7DashboardSectionPanel.css";

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   className?: string;
 *   contentClassName?: string;
 * }} props
 */
export default function S7DashboardSectionPanel({ children, className = "", contentClassName = "" }) {
  const panelClass = ["s7-dashboard-section-panel", className].filter(Boolean).join(" ");
  const bodyClass = ["s7-dashboard-section-panel__body", contentClassName].filter(Boolean).join(" ");

  return (
    <article className={panelClass}>
      <div className={bodyClass}>{children}</div>
    </article>
  );
}

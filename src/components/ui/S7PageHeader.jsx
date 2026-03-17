// ======================================================================
// S7PageHeader
// Cabeçalho padrão de páginas (título + ações).
// ======================================================================

import "./S7PageHeader.css";

export default function S7PageHeader({ title, subtitle, actions }) {
  return (
    <header className="s7-page-header">
      <div className="s7-page-header__titles">
        {title && <h1 className="s7-page-header__title">{title}</h1>}
        {subtitle && (
          <p className="s7-page-header__subtitle">{subtitle}</p>
        )}
      </div>
      {actions && <div className="s7-page-header__actions">{actions}</div>}
    </header>
  );
}


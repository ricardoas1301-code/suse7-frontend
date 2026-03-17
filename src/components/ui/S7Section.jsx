// ======================================================================
// S7Section
// Bloco de seção padrão para formulários e páginas.
// - Controla título, espaçamento vertical e container visual.
// - Não tem lógica de negócio, apenas layout.
// ======================================================================

import "./S7Section.css";

export default function S7Section({ title, description, children, actions }) {
  return (
    <section className="s7-section">
      {(title || actions) && (
        <header className="s7-section__header">
          <div className="s7-section__titles">
            {title && <h2 className="s7-section__title">{title}</h2>}
            {description && (
              <p className="s7-section__description">{description}</p>
            )}
          </div>
          {actions && <div className="s7-section__actions">{actions}</div>}
        </header>
      )}

      <div className="s7-section__body">{children}</div>
    </section>
  );
}


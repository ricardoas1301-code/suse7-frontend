import "./NotificationCenterSectionCard.css";

/**
 * Card de seção da Central de Notificações (reutilizável entre categorias).
 *
 * @param {{
 *   title: string;
 *   description?: string;
 *   children: import("react").ReactNode;
 *   className?: string;
 *   emptyMessage?: string;
 *   isEmpty?: boolean;
 * }} props
 */
export default function NotificationCenterSectionCard({
  title,
  description,
  children,
  className = "",
  emptyMessage = null,
  isEmpty = false,
}) {
  return (
    <section
      className={`s7-ncenter-section-card ${className}`.trim()}
      aria-labelledby={`s7-ncenter-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <header className="s7-ncenter-section-card__head">
        <h3 id={`s7-ncenter-section-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      {isEmpty && emptyMessage ? (
        <p className="s7-ncenter-section-card__empty">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

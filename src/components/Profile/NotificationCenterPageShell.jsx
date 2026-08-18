import "./NotificationCenterPageShell.css";

/**
 * Shell compartilhado — Central de Notificações (card pai + gutter 12px via Profile.css).
 *
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   headerAction?: import("react").ReactNode;
 *   children: import("react").ReactNode;
 *   className?: string;
 * }} props
 */
export default function NotificationCenterPageShell({
  title,
  subtitle,
  headerAction = null,
  children,
  className = "",
}) {
  return (
    <div className={`dados-empresa-page s7-notification-center-page ${className}`.trim()}>
      <div className="profile-card s7-notification-center-hero">
        <header className="s7-notification-center-hero__head">
          <div className="s7-notification-center-hero__title-row">
            <h2>{title}</h2>
            {headerAction ? (
              <div className="s7-notification-center-hero__actions">{headerAction}</div>
            ) : null}
          </div>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
        <div className="s7-notification-center-hero__body">{children}</div>
      </div>
    </div>
  );
}

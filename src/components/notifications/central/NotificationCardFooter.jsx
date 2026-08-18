import "./NotificationCardFooter.css";

/**
 * Rodapé canônico dos cards de notificação (grade Vendas).
 * @param {{ actions: import("react").ReactNode; children?: import("react").ReactNode }} props
 */
export default function NotificationCardFooter({ actions, children = null }) {
  return (
    <footer className="s7-npref-group__footer">
      <div className="s7-npref-group__footer-divider" aria-hidden="true" />
      <div className="s7-npref-group__footer-actions">{actions}</div>
      {children}
    </footer>
  );
}

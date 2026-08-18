import S7Icon from "./S7Icon.jsx";
import "./S7ImportantNotice.css";

/**
 * Aviso IMPORTANTE — SSOT visual (onboarding + modal Mercado Livre).
 *
 * @param {{
 *   id?: string;
 *   children: import("react").ReactNode;
 *   className?: string;
 * }} props
 */
export default function S7ImportantNotice({ id, children, className = "" }) {
  return (
    <div
      id={id}
      className={["s7-important-notice", className].filter(Boolean).join(" ")}
      role="note"
    >
      <S7Icon name="AlertTriangle" size={20} className="s7-important-notice__icon" aria-hidden />
      <div className="s7-important-notice__body">
        <p className="s7-important-notice__title">IMPORTANTE</p>
        <p className="s7-important-notice__copy">{children}</p>
      </div>
    </div>
  );
}

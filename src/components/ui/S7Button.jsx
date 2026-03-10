// ======================================================
// COMPONENTE GLOBAL: S7Button
// Objetivo:
// - Padronizar os botões do Suse7
// - Centralizar variantes visuais do sistema
// - Suporte oficial a ícones via S7Icon (iconName, iconPosition)
// ======================================================

import S7Icon from "./S7Icon";
import "./S7Button.css";

export default function S7Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  size = "md",
  icon = null,
  iconName = "",
  iconPosition = "left",
  iconSize = 16,
  disabled = false,
  className = "",
  title = "",
}) {
  const classes = [
    "s7-btn",
    `s7-btn--${variant}`,
    `s7-btn--${size}`,
    disabled ? "s7-btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const renderIcon = () => {
    if (icon) return icon;
    if (iconName) {
      return (
        <S7Icon name={iconName} size={iconSize} />
      );
    }
    return null;
  };

  const iconContent = renderIcon();
  const showLeftIcon = iconContent && (icon ? true : iconPosition === "left");
  const showRightIcon = iconContent && !icon && iconPosition === "right";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={title || undefined}
    >
      {showLeftIcon ? (
        <span className="s7-btn__icon">{iconContent}</span>
      ) : null}
      {children != null && children !== "" ? (
        <span className="s7-btn__label">{children}</span>
      ) : null}
      {showRightIcon ? (
        <span className="s7-btn__icon">{iconContent}</span>
      ) : null}
    </button>
  );
}

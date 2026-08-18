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
  loading = false,
  loadingLabel = "Salvando...",
  className = "",
  title = "",
  form = undefined,
  id = undefined,
}) {
  const isBusy = loading || disabled;
  const classes = [
    "s7-btn",
    `s7-btn--${variant}`,
    `s7-btn--${size}`,
    loading ? "s7-btn--loading" : "",
    isBusy ? "s7-btn--disabled" : "",
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
  const showLeftIcon = !loading && iconContent && (icon ? true : iconPosition === "left");
  const showRightIcon = !loading && iconContent && !icon && iconPosition === "right";

  return (
    <button
      type={type}
      id={id}
      form={form}
      onClick={loading ? undefined : onClick}
      disabled={isBusy}
      className={classes}
      title={title || undefined}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <span className="s7-btn__spinner" aria-hidden />
          <span className="s7-btn__label">{loadingLabel}</span>
        </>
      ) : (
        <>
          {showLeftIcon ? (
            <span className="s7-btn__icon">{iconContent}</span>
          ) : null}
          {children != null && children !== "" ? (
            <span className="s7-btn__label">{children}</span>
          ) : null}
          {showRightIcon ? (
            <span className="s7-btn__icon">{iconContent}</span>
          ) : null}
        </>
      )}
    </button>
  );
}

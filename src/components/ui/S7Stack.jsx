// ======================================================
// COMPONENTE: S7Stack
// Objetivo:
// Organizar elementos vertical ou horizontalmente
// com espaçamento consistente entre eles.
// ======================================================

import "./S7Stack.css";

export default function S7Stack({
  children,
  direction = "vertical",
  gap = "md",
  align = "stretch",
  justify = "flex-start",
  className = "",
}) {
  const classes = [
    "s7-stack",
    `s7-stack--${direction}`,
    `s7-stack--gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{
        alignItems: align,
        justifyContent: justify,
      }}
    >
      {children}
    </div>
  );
}

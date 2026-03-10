// ======================================================
// COMPONENTE: S7Grid
// Objetivo:
// Organizar elementos em grid com número de colunas
// configurável.
// ======================================================

import "./S7Grid.css";

export default function S7Grid({
  children,
  columns = 2,
  gap = "md",
  className = "",
}) {
  const classes = [
    "s7-grid",
    `s7-grid--gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {children}
    </div>
  );
}

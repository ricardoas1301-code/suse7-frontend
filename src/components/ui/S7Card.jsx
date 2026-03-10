// ======================================================
// COMPONENTE: S7Card
// Objetivo:
// Criar blocos visuais consistentes para organizar
// conteúdo em seções.
// ======================================================

import "./S7Card.css";

export default function S7Card({
  children,
  className = "",
}) {
  const classes = [
    "s7-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

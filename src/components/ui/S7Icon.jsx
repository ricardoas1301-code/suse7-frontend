// ======================================================
// COMPONENTE: S7Icon
// Objetivo:
// - Centralizar o uso de ícones do Suse7
// - Garantir consistência visual no sistema
// - Evitar imports soltos de ícones em telas e componentes
// ======================================================

import { iconsMap } from "./iconsMap";
import "./S7Icon.css";

export default function S7Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className = "",
}) {
  const IconComponent = iconsMap[name];

  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={`s7-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

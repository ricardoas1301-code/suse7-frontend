// ======================================================
// COMPONENTE: S7EmptyState
// Objetivo:
// - Padronizar estados vazios do sistema
// - Melhorar a experiência em telas sem dados
// - Reforçar consistência visual do Design System
// ======================================================

import S7Icon from "./S7Icon";
import "./S7EmptyState.css";

export default function S7EmptyState({
  iconName = "empty",
  title = "Nada por aqui ainda",
  description = "",
  action = null,
  className = "",
}) {
  return (
    <div className={`s7-empty-state ${className}`.trim()}>
      <div className="s7-empty-state__icon">
        <S7Icon name={iconName} size={28} />
      </div>

      <div className="s7-empty-state__title">
        {title}
      </div>

      {description ? (
        <div className="s7-empty-state__description">
          {description}
        </div>
      ) : null}

      {action ? (
        <div className="s7-empty-state__action">
          {action}
        </div>
      ) : null}
    </div>
  );
}

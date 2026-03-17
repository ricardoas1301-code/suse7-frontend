// ======================================================
// COMPONENTE: S7ActionBar
// Objetivo:
// - Padronizar barras de ação e contexto do Suse7
// - Organizar título, tooltip, meta, filtros e ações
// - Garantir consistência visual em áreas analíticas e operacionais
// ======================================================

import S7Icon from "./S7Icon";
import "./S7ActionBar.css";

export default function S7ActionBar({
  title = "",
  subtitle = "",
  tooltip = "",
  meta = null,
  leftContent = null,
  rightContent = null,
  className = "",
}) {
  return (
    <div className={`s7-action-bar ${className}`.trim()}>
      <div className="s7-action-bar__left">
        {(title || subtitle || tooltip || meta) ? (
          <div className="s7-action-bar__heading">
            {(title || tooltip || meta) ? (
              <div className="s7-action-bar__title-row">
                {title ? (
                  <div className="s7-action-bar__title">
                    {title}
                  </div>
                ) : null}

                {tooltip ? (
                  <span
                    className="pf-info-btn s7-tip"
                    data-tip={tooltip}
                    aria-label="Informações"
                  >
                    <S7Icon name="info" size={16} />
                  </span>
                ) : null}

                {meta ? (
                  <div className="s7-action-bar__meta">
                    {meta}
                  </div>
                ) : null}
              </div>
            ) : null}

            {subtitle ? (
              <div className="s7-action-bar__subtitle">
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : null}

        {leftContent ? (
          <div className="s7-action-bar__left-content">
            {leftContent}
          </div>
        ) : null}
      </div>

      {rightContent ? (
        <div className="s7-action-bar__right">
          {rightContent}
        </div>
      ) : null}
    </div>
  );
}

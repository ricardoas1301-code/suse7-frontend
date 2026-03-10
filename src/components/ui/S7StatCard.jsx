// ======================================================
// COMPONENTE: S7StatCard
// Objetivo:
// - Padronizar cards de indicadores do Suse7
// - Exibir métricas com leitura rápida e hierarquia clara
// - Dar base visual para dashboards e monitoramento
// ======================================================

import S7Icon from "./S7Icon";
import "./S7StatCard.css";

export default function S7StatCard({
  title = "",
  value = "",
  subtitle = "",
  iconName = "",
  trend = "",
  trendLabel = "",
  variant = "default",
  highlight = false,
  className = "",
}) {
  const classes = [
    "s7-stat-card",
    `s7-stat-card--${variant}`,
    highlight ? "s7-stat-card--highlight" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="s7-stat-card__top">
        <div className="s7-stat-card__heading">
          {title ? (
            <div className="s7-stat-card__title">
              {title}
            </div>
          ) : null}

          {subtitle ? (
            <div className="s7-stat-card__subtitle">
              {subtitle}
            </div>
          ) : null}
        </div>

        {iconName ? (
          <div className="s7-stat-card__icon">
            <S7Icon name={iconName} size={18} />
          </div>
        ) : null}
      </div>

      <div className="s7-stat-card__value">
        {value}
      </div>

      {(trend || trendLabel) ? (
        <div className={`s7-stat-card__trend s7-stat-card__trend--${trend || "neutral"}`}>
          {trendLabel}
        </div>
      ) : null}
    </div>
  );
}

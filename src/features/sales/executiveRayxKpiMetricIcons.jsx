// ======================================================================
// Ícones KPI executivo — paridade Raio-X produto (Vendas) e Resumo Diário.
// Somente apresentação; sem lógica financeira.
// ======================================================================

import { CircleDollarSign, Coins, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

const BASE_CLASS = "s7-daily-summary__metric-value-icon";

/**
 * @param {string} metricId
 * @returns {import("react").ReactNode | null}
 */
export function renderExecutiveRayxKpiMetricIcon(metricId) {
  switch (metricId) {
    case "orders":
      return (
        <ShoppingCart className={`${BASE_CLASS} ${BASE_CLASS}--sales`} aria-hidden />
      );
    case "revenue":
      return <Wallet className={`${BASE_CLASS} ${BASE_CLASS}--revenue`} aria-hidden />;
    case "net_profit":
      return <Coins className={`${BASE_CLASS} ${BASE_CLASS}--profit`} aria-hidden />;
    case "avg_margin":
      return <TrendingUp className={`${BASE_CLASS} ${BASE_CLASS}--margin`} aria-hidden />;
    case "marketplace_payout":
      return (
        <CircleDollarSign className={`${BASE_CLASS} ${BASE_CLASS}--repasse`} aria-hidden />
      );
    default:
      return null;
  }
}

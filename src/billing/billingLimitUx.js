// ======================================================================
// UX de limites — exibição a partir do payload seller-centric do backend
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} usage
 * @param {Record<string, unknown> | null | undefined} limits
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function resolveBillingLimitUx(usage, limits, plan) {
  const source = usage ?? limits;
  if (!source) return null;

  const percent = source.usage_percent != null ? Number(source.usage_percent) : null;
  const current =
    source.total_sales_month != null
      ? Number(source.total_sales_month)
      : source.current_month_sales != null
        ? Number(source.current_month_sales)
        : null;
  const max =
    source.limit_sales_month != null
      ? Number(source.limit_sales_month)
      : source.monthly_sales_limit != null
        ? Number(source.monthly_sales_limit)
        : null;
  const planLabel = plan?.marketing_name ?? plan?.display_name ?? plan?.plan_name ?? plan?.plan_key ?? "seu plano";
  const uxState = String(source.ux_state || limits?.ux_state || "within_limit");

  if (uxState === "unmetered") return null;

  if (uxState === "near_limit" && percent != null) {
    return {
      tone: "info",
      title: `Seu ecossistema vendeu ${Math.round(percent)}% do limite mensal do plano ${planLabel}.`,
      description:
        "O Suse7 consolidou automaticamente as vendas de todas as suas empresas, contas e marketplaces.",
    };
  }

  if (uxState === "grace") {
    return {
      tone: "warning",
      title: "Volume consolidado acima do limite mensal",
      description:
        "Seu plano segue com tolerância temporária. Recomendamos upgrade para manter o ecossistema sem interrupções.",
    };
  }

  if (uxState === "over_limit") {
    return {
      tone: "warning",
      title: `Seu volume consolidado ultrapassou o limite do plano ${planLabel}.`,
      description: `O ecossistema total registrou ${current?.toLocaleString("pt-BR") ?? "—"} vendas no mês.`,
    };
  }

  if (uxState === "hard_blocked") {
    return {
      tone: "danger",
      title: "Acesso reduzido por limite consolidado",
      description: "Atualize o plano para liberar novamente o ecossistema operacional completo.",
    };
  }

  if (current != null && max != null) {
    return {
      tone: "muted",
      title: `Ecossistema: ${current.toLocaleString("pt-BR")} de ${max.toLocaleString("pt-BR")} vendas/mês`,
      description: "Consolidação automática no backend — sem contagem manual por conta ou marketplace.",
    };
  }

  return null;
}

import { resolveMonthlyUsageDisplay } from "../subscriptionUsage";



export default function SubscriptionUsageBar({

  usage,

  limits,

  monthlySalesLimit,

  loading = false,

  usageUnavailable = false,

}) {

  const display = resolveMonthlyUsageDisplay(usage, limits, monthlySalesLimit, {

    loading,

    usageUnavailable,

  });



  return (

    <section

      className={`s7-billing-usage-bar s7-billing-usage-bar--${display.tone}`}

      aria-label="Consumo mensal de vendas"

    >

      <div className="s7-billing-usage-bar__header">

        <p className="s7-billing-card-eyebrow s7-billing-usage-bar__eyebrow">Consumo mensal do ecossistema</p>

        <span className="s7-billing-usage-bar__percent">

          {display.mode === "open" ? display.limitLabel : display.percentLabel}

        </span>

      </div>

      <p className="s7-billing-usage-bar__caption">{display.usageLabel}</p>

      {display.mode !== "unavailable" && display.mode !== "loading" ? (

        <div className="s7-billing-usage-bar__track" aria-hidden="true">

          <div className="s7-billing-usage-bar__fill" style={{ width: `${display.barPercent}%` }} />

        </div>

      ) : null}

      {display.mode === "metered" ? (

        <div className="s7-billing-usage-bar__meta-row">

          <span>Limite do plano: {display.limitLabel}</span>

          {display.periodLabel ? (

            <>

              <span className="s7-billing-usage-bar__meta-divider" aria-hidden="true" />

              <span>{display.periodLabel}</span>

            </>

          ) : null}

        </div>

      ) : display.mode === "open" ? (

        <p className="s7-billing-usage-bar__meta s7-billing-usage-bar__meta-row--single">

          O consumo consolida vendas de todas as contas e marketplaces.

        </p>

      ) : null}

    </section>

  );

}


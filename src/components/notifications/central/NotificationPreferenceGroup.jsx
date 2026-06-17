import NotificationChannelToggle from "./NotificationChannelToggle";
import NotificationEventRecipientRules from "./NotificationEventRecipientRules";
import NotificationDailySalesSchedule from "./NotificationDailySalesSchedule";
import { getDailySalesSummaryCardDisplayState } from "./dailySalesSummaryScheduleUtils";
import "./NotificationPreferenceGroup.css";
import "./NotificationDailySalesSchedule.css";

export default function NotificationPreferenceGroup({
  type,
  pref,
  channelsMeta,
  savingPrefKey,
  savingRuleKey,
  savingAutomationRule,
  recipientGroups,
  deliveryRules,
  dailySalesSummaryRule,
  onChannelChange,
  onEventRuleChange,
  onDailySalesSummaryRuleChange,
}) {
  if (!type) return null;

  const isDailySummary = String(type.type_key) === "DAILY_SALES_SUMMARY";
  const mandatory = Boolean(type.is_mandatory);
  const supported = new Set(
    (type.supported_channels?.length ? type.supported_channels : ["in_app", "email", "whatsapp"]).map(
      String
    )
  );

  const dailyDisplay = isDailySummary
    ? getDailySalesSummaryCardDisplayState(dailySalesSummaryRule)
    : null;

  const dailyEnabled = dailySalesSummaryRule?.enabled !== false;

  const toggleDailyEnabled = (enabled) => {
    const config =
      dailySalesSummaryRule?.config && typeof dailySalesSummaryRule.config === "object"
        ? dailySalesSummaryRule.config
        : {};
    onDailySalesSummaryRuleChange?.({
      enabled,
      config,
    });
  };

  return (
    <article className={`s7-npref-group ${mandatory ? "s7-npref-group--mandatory" : ""}`}>
      <header className="s7-npref-group__head">
        <div className="s7-npref-group__head-main">
          <div className="s7-npref-group__title-row">
            <h4>{type.label}</h4>
            {isDailySummary ? (
              <label
                className={`s7-npref-group__master-toggle ${dailyEnabled ? "s7-npref-group__master-toggle--on" : ""} ${savingAutomationRule ? "s7-npref-group__master-toggle--disabled" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={dailyEnabled}
                  disabled={savingAutomationRule}
                  aria-label={`${dailyEnabled ? "Desativar" : "Ativar"} resumo de vendas do dia`}
                  onChange={(e) => toggleDailyEnabled(e.target.checked)}
                />
                <span className="s7-npref-group__master-track" aria-hidden />
                <span className="s7-npref-group__master-label">
                  {dailyEnabled ? "Ativo" : "Inativo"}
                </span>
              </label>
            ) : null}
          </div>
          <p>{type.description}</p>
          {isDailySummary && dailyDisplay ? (
            <div className="s7-npref-group__head-meta">
              <span
                className={`s7-npref-group__rule-badge s7-npref-group__rule-badge--${dailyDisplay.badgeVariant}`}
              >
                {dailyDisplay.badge}
              </span>
              <p className="s7-npref-group__schedule-badge">{dailyDisplay.summary}</p>
            </div>
          ) : null}
        </div>
        {mandatory ? <span className="s7-npref-group__badge">Obrigatória</span> : null}
      </header>

      {mandatory ? (
        <p className="s7-npref-group__mandatory-hint">
          Notificação obrigatória no app. E-mail e WhatsApp são definidos por destinatário abaixo.
        </p>
      ) : null}

      {!isDailySummary ? (
        <div className="s7-npref-group__channels">
          {(channelsMeta ?? [])
            .filter((ch) => ch.key === "in_app")
            .map((ch) => {
              if (!supported.has(ch.key) && !ch.future) return null;
              const state = pref?.channels?.[ch.key];
              const saving = savingPrefKey === `${pref?.category_code}:${pref?.type_key}:${ch.key}`;

              return (
                <NotificationChannelToggle
                  key={ch.key}
                  channelKey={ch.key}
                  label={ch.label}
                  description={ch.description ?? "Alertas dentro do Suse7."}
                  enabled={state?.enabled ?? false}
                  locked={Boolean(state?.locked)}
                  future={Boolean(ch.future)}
                  saving={saving}
                  disabled={!pref}
                  onChange={(channel, enabled) =>
                    onChannelChange?.(pref.category_code, pref.type_key, channel, enabled)
                  }
                />
              );
            })}
        </div>
      ) : null}

      {(supported.has("email") || supported.has("whatsapp") || isDailySummary) && (
        <NotificationEventRecipientRules
          categoryCode={pref.category_code}
          typeKey={pref.type_key}
          groups={recipientGroups}
          rules={deliveryRules}
          saving={Boolean(savingRuleKey) || Boolean(savingAutomationRule)}
          expandLabel={isDailySummary ? "Destinatários / Regras" : "Destinatários"}
          hideStatusBadge={isDailySummary}
          scheduleSlot={
            isDailySummary ? (
              <NotificationDailySalesSchedule
                rule={dailySalesSummaryRule}
                saving={Boolean(savingAutomationRule)}
                onChange={onDailySalesSummaryRuleChange}
              />
            ) : null
          }
          onChange={onEventRuleChange}
        />
      )}
    </article>
  );
}

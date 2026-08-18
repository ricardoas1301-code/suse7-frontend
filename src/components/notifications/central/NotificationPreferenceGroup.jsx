import NotificationChannelToggle from "./NotificationChannelToggle";
import NotificationEventRecipientRules from "./NotificationEventRecipientRules";
import NotificationDailySalesSchedule from "./NotificationDailySalesSchedule";
import NotificationDailySalesDualExpanders from "./NotificationDailySalesDualExpanders";
import { getDailySalesSummaryCardDisplayState, getDailySalesSummaryCompactCardMetadata } from "./dailySalesSummaryScheduleUtils";
import { NOTIFICATION_IN_APP_CHANNEL_DESCRIPTION } from "../../../constants/notificationChannelPresentation";
import { useState } from "react";
import "../center/notificationCenterVisualVariants.css";
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
  compact = false,
  highlightExpandedRecipients = false,
  showLeftAccent = false,
}) {
  const [layoutExpanded, setLayoutExpanded] = useState(false);

  if (!type) return null;

  const isDailySummary = String(type.type_key) === "DAILY_SALES_SUMMARY";
  const mandatory = Boolean(type.is_mandatory);
  const supported = new Set(
    (type.supported_channels?.length ? type.supported_channels : ["in_app", "email", "whatsapp"]).map(
      String
    )
  );
  const inAppLockedMandatory =
    mandatory && supported.has("in_app") && Boolean(pref?.channels?.in_app?.locked);
  const hasInAppChannel = !isDailySummary && supported.has("in_app") && !inAppLockedMandatory;

  const splitDailyExpanders = isDailySummary && compact && highlightExpandedRecipients;

  const dailyMetadata =
    isDailySummary && splitDailyExpanders
      ? getDailySalesSummaryCompactCardMetadata(dailySalesSummaryRule)
      : null;

  const dailyDisplay =
    isDailySummary && !splitDailyExpanders
      ? getDailySalesSummaryCardDisplayState(dailySalesSummaryRule, {
          deliveryRules,
          recipientGroups,
          categoryCode: pref?.category_code,
          typeKey: pref?.type_key,
        })
      : null;

  const cardClassName = [
    "s7-npref-group",
    mandatory ? "s7-npref-group--mandatory" : "",
    compact ? "s7-npref-group--compact" : "",
    compact && hasInAppChannel ? "s7-npref-group--has-in-app" : "",
    compact && layoutExpanded ? "s7-npref-group--layout-expanded" : "",
    showLeftAccent && !mandatory ? "s7-ncenter-card--left-accent-blue" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <div className="s7-npref-group__body">
      <header className="s7-npref-group__head">
        <div className="s7-npref-group__head-main">
          <div className="s7-npref-group__title-row">
            <h4>{type.label}</h4>
          </div>
          <p>{type.description}</p>
          {dailyMetadata ? (
            <div className="s7-npref-group__head-meta s7-npref-group__head-meta--schedule">
              <p className="s7-npref-group__schedule-line">
                <span className="s7-npref-group__schedule-label">Dias:</span> {dailyMetadata.daysLine}
              </p>
              <p className="s7-npref-group__schedule-line">
                <span className="s7-npref-group__schedule-label">{dailyMetadata.timesLabel}:</span>{" "}
                {dailyMetadata.timesLine}
              </p>
            </div>
          ) : null}
          {!dailyMetadata && isDailySummary && dailyDisplay ? (
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

      {!isDailySummary && hasInAppChannel ? (
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
                  description={ch.description ?? NOTIFICATION_IN_APP_CHANNEL_DESCRIPTION}
                  enabled={state?.enabled ?? false}
                  locked={Boolean(state?.locked)}
                  future={Boolean(ch.future)}
                  saving={saving}
                  disabled={!pref}
                  compactInCard={compact}
                  onChange={(channel, enabled) =>
                    onChannelChange?.(pref.category_code, pref.type_key, channel, enabled)
                  }
                />
              );
            })}
        </div>
      ) : null}
      </div>

      {(supported.has("email") || supported.has("whatsapp") || isDailySummary) &&
        (splitDailyExpanders ? (
          <NotificationDailySalesDualExpanders
            categoryCode={pref.category_code}
            typeKey={pref.type_key}
            recipientGroups={recipientGroups}
            deliveryRules={deliveryRules}
            dailySalesSummaryRule={dailySalesSummaryRule}
            savingRules={Boolean(savingRuleKey)}
            savingAutomation={Boolean(savingAutomationRule)}
            compact={compact}
            recipientRowAccent={highlightExpandedRecipients}
            onExpandedChange={compact ? setLayoutExpanded : undefined}
            onEventRuleChange={onEventRuleChange}
            onDailySalesSummaryRuleChange={onDailySalesSummaryRuleChange}
          />
        ) : (
          <NotificationEventRecipientRules
            categoryCode={pref.category_code}
            typeKey={pref.type_key}
            groups={recipientGroups}
            rules={deliveryRules}
            saving={Boolean(savingRuleKey) || Boolean(savingAutomationRule)}
            expandLabel={isDailySummary ? "Destinatários / Regras" : "Destinatários"}
            hideStatusBadge={isDailySummary}
            compact={compact}
            canonicalFooter={compact}
            recipientRowAccent={highlightExpandedRecipients}
            onExpandedChange={compact ? setLayoutExpanded : undefined}
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
        ))}
    </article>
  );
}

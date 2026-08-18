import { useEffect, useMemo, useState } from "react";
import "../center/notificationCenterVisualVariants.css";
import NotificationDailySalesSchedule from "./NotificationDailySalesSchedule";
import NotificationRecipientRulesContent from "./NotificationRecipientRulesContent";
import NotificationCardFooter from "./NotificationCardFooter";
import NotificationEventRulesStatusBadge from "./NotificationEventRulesStatusBadge";
import "./NotificationEventRecipientRules.css";
import "./NotificationCardFooter.css";

/** @typedef {null | "recipients" | "rules"} DailySummaryOpenPanel */

/**
 * Destinatários e Regras — expansores mutuamente exclusivos (Resumo de vendas do dia).
 */
export default function NotificationDailySalesDualExpanders({
  categoryCode,
  typeKey,
  recipientGroups,
  deliveryRules,
  dailySalesSummaryRule,
  savingRules,
  savingAutomation,
  compact = false,
  recipientRowAccent = false,
  onExpandedChange,
  onEventRuleChange,
  onDailySalesSummaryRuleChange,
}) {
  /** @type {[DailySummaryOpenPanel, import("react").Dispatch<import("react").SetStateAction<DailySummaryOpenPanel>>]} */
  const [openPanel, setOpenPanel] = useState(null);
  const recipientsPanelId = `s7-daily-recipients-panel-${String(categoryCode)}-${String(typeKey)}`;
  const rulesPanelId = `s7-daily-rules-panel-${String(categoryCode)}-${String(typeKey)}`;

  useEffect(() => {
    onExpandedChange?.(openPanel !== null);
    return () => {
      onExpandedChange?.(false);
    };
  }, [openPanel, onExpandedChange]);

  const hasSavedRules = useMemo(
    () =>
      (deliveryRules ?? []).some(
        (r) => String(r.category_code) === categoryCode && String(r.type_key) === typeKey
      ),
    [deliveryRules, categoryCode, typeKey]
  );

  const saving = Boolean(savingRules) || Boolean(savingAutomation);

  /** @param {"recipients" | "rules"} panel */
  const togglePanel = (panel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const recipientsOpen = openPanel === "recipients";
  const rulesOpen = openPanel === "rules";

  return (
    <NotificationCardFooter
      actions={
        <>
          <button
            type="button"
            className="s7-nevent-rules__toggle"
            onClick={() => togglePanel("recipients")}
            aria-expanded={recipientsOpen}
            aria-controls={recipientsPanelId}
          >
            {recipientsOpen ? "▼" : "▶"} Destinatários
          </button>

          <button
            type="button"
            className="s7-nevent-rules__toggle"
            onClick={() => togglePanel("rules")}
            aria-expanded={rulesOpen}
            aria-controls={rulesPanelId}
          >
            {rulesOpen ? "▼" : "▶"} Regras
          </button>

          <NotificationEventRulesStatusBadge saving={saving} hasSavedRules={hasSavedRules} />
        </>
      }
    >
      {recipientsOpen ? (
        <div
          id={recipientsPanelId}
          role="group"
          aria-label="Destinatários"
          className="s7-nevent-rules__panel s7-nevent-rules__panel--neutral s7-npref-group__footer-panel"
        >
          <NotificationRecipientRulesContent
            categoryCode={categoryCode}
            typeKey={typeKey}
            groups={recipientGroups}
            rules={deliveryRules}
            saving={saving}
            compact={compact}
            recipientRowAccent={recipientRowAccent}
            onChange={onEventRuleChange}
          />
        </div>
      ) : null}

      {rulesOpen ? (
        <div
          id={rulesPanelId}
          role="group"
          aria-label="Regras"
          className="s7-nevent-rules__panel s7-nevent-rules__panel--neutral s7-npref-group__footer-panel"
        >
          <NotificationDailySalesSchedule
            rule={dailySalesSummaryRule}
            saving={Boolean(savingAutomation)}
            onChange={onDailySalesSummaryRuleChange}
          />
        </div>
      ) : null}
    </NotificationCardFooter>
  );
}

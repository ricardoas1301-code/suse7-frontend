import { useEffect, useMemo } from "react";
import NotificationPreferenceGroup from "../central/NotificationPreferenceGroup";
import { pickNotificationCategoriesForSection } from "../../../constants/notificationCenterSections";
import { sortNotificationTypesForPresentation } from "../../../constants/notificationCenterPresentationOrder";
import { applyNotificationEventPresentation } from "../../../constants/notificationEventPresentation";
import "./NotificationDeliverySection.css";
import "./NotificationCenterSectionCard.css";

/** @param {string} categoryCode @param {string} typeKey */
export function notificationEventAnchorId(categoryCode, typeKey) {
  return `s7-npref-${String(categoryCode).toLowerCase()}-${String(typeKey).toLowerCase()}`;
}

export const NOTIFICATION_DELIVERY_SECTION_COPY = {
  title: "Notificações",
  description: "Configure os canais e escolha quem receberá cada comunicação da sua operação.",
  legacyTitle: "Notificações e destinatários",
  legacyDescription: "Escolha canais no app e vincule destinatários por e-mail ou WhatsApp.",
};

/**
 * @param {{
 *   section: import("../../../constants/notificationCenterSections.js").NotificationCenterSection;
 *   categories: Array<Record<string, unknown>>;
 *   channelsMeta: Array<Record<string, unknown>>;
 *   prefLookup: Map<string, unknown>;
 *   savingPrefKey: string | null;
 *   savingRuleKey: string | null;
 *   savingAutomationRule: boolean;
 *   recipientGroups: Array<Record<string, unknown>>;
 *   deliveryRules: Array<Record<string, unknown>>;
 *   dailySalesSummaryRule: Record<string, unknown> | null;
 *   onChannelChange: Function;
 *   onEventRuleChange: Function;
 *   onDailySalesSummaryRuleChange: Function;
 *   highlightTypeKey?: string | null;
 *   loading?: boolean;
 *   hideHeader?: boolean;
 *   layout?: "stack" | "grid";
 *   highlightExpandedRecipients?: boolean;
 * }} props
 */
export default function NotificationDeliverySection({
  section,
  categories,
  channelsMeta,
  prefLookup,
  savingPrefKey,
  savingRuleKey,
  savingAutomationRule,
  recipientGroups,
  deliveryRules,
  dailySalesSummaryRule,
  onChannelChange,
  onEventRuleChange,
  onDailySalesSummaryRuleChange,
  highlightTypeKey = null,
  loading = false,
  hideHeader = false,
  layout = "stack",
  highlightExpandedRecipients = false,
}) {
  const filteredCategories = pickNotificationCategoriesForSection(
    categories,
    section.notificationGroups ?? []
  );

  const isGrid = layout === "grid";

  const flatTypes = useMemo(() => {
    const flat = filteredCategories.flatMap((cat) =>
      (cat.types ?? []).map((type) => ({
        category: cat,
        type: applyNotificationEventPresentation(type),
      }))
    );
    return isGrid ? sortNotificationTypesForPresentation(flat) : flat;
  }, [filteredCategories, isGrid]);

  useEffect(() => {
    const key = String(highlightTypeKey ?? "").trim();
    if (!key || loading) return;
    const match = flatTypes.find((entry) => String(entry.type.type_key) === key);
    if (!match) return;
    const el = document.getElementById(
      notificationEventAnchorId(match.category.code, match.type.type_key)
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightTypeKey, loading, flatTypes]);

  if (!flatTypes.length) return null;

  const title = hideHeader
    ? NOTIFICATION_DELIVERY_SECTION_COPY.title
    : NOTIFICATION_DELIVERY_SECTION_COPY.legacyTitle;
  const description = hideHeader
    ? NOTIFICATION_DELIVERY_SECTION_COPY.description
    : NOTIFICATION_DELIVERY_SECTION_COPY.legacyDescription;
  const listClassName = isGrid
    ? "s7-ncenter-section-grid s7-ncenter-delivery__list s7-ncenter-delivery__list--grid"
    : "s7-ncenter-delivery__list";

  return (
    <section
      className={`s7-ncenter-delivery ${hideHeader ? "s7-ncenter-delivery--embedded" : ""}`.trim()}
      aria-labelledby={hideHeader ? undefined : "s7-ncenter-delivery-title"}
    >
      {!hideHeader ? (
        <header className="s7-ncenter-delivery__head">
          <h3 id="s7-ncenter-delivery-title">{title}</h3>
          <p>{description}</p>
        </header>
      ) : null}

      {loading ? (
        <p className="s7-ncenter-delivery__loading">Carregando notificações…</p>
      ) : (
        <div className={listClassName}>
          {flatTypes.map(({ category, type }) => {
            const pref =
              prefLookup?.get(`${category.code}:${type.type_key}`) ?? {
                category_code: category.code,
                type_key: type.type_key,
                is_mandatory: type.is_mandatory,
                channels: {},
              };
            const highlighted = highlightTypeKey && String(type.type_key) === String(highlightTypeKey);

            return (
              <div
                key={`${category.code}:${type.type_key}`}
                id={notificationEventAnchorId(category.code, type.type_key)}
                className={
                  highlighted
                    ? "s7-ncenter-delivery__item s7-ncenter-delivery__item--highlighted"
                    : "s7-ncenter-delivery__item"
                }
              >
                <NotificationPreferenceGroup
                  type={type}
                  pref={pref}
                  channelsMeta={channelsMeta}
                  savingPrefKey={savingPrefKey}
                  savingRuleKey={savingRuleKey}
                  savingAutomationRule={savingAutomationRule}
                  recipientGroups={recipientGroups}
                  deliveryRules={deliveryRules}
                  dailySalesSummaryRule={
                    String(type.type_key) === "DAILY_SALES_SUMMARY" ? dailySalesSummaryRule : null
                  }
                  onChannelChange={onChannelChange}
                  onEventRuleChange={onEventRuleChange}
                  onDailySalesSummaryRuleChange={onDailySalesSummaryRuleChange}
                  compact={isGrid}
                  highlightExpandedRecipients={highlightExpandedRecipients}
                  showLeftAccent={isGrid}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

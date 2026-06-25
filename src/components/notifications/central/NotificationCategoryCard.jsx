import NotificationPreferenceGroup from "./NotificationPreferenceGroup";

import { focusAnchorId } from "./centralNotificationFocus";

import "./NotificationCategoryCard.css";



export default function NotificationCategoryCard({

  category,

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

  highlighted,

}) {

  if (!category) return null;



  return (

    <section

      id={focusAnchorId(category.code)}

      className={`s7-ncat-card ${highlighted ? "s7-ncat-card--focused" : ""}`}

    >

      <header className="s7-ncat-card__head">

        <div>

          <h3>{category.label}</h3>

          <p>{category.description}</p>

        </div>

        <span className="s7-ncat-card__count">{category.types?.length ?? 0} tipos</span>

      </header>



      <div className="s7-ncat-card__types">

        {(category.types ?? []).map((type) => {

          const pref = prefLookup?.get(`${category.code}:${type.type_key}`) ?? {

            category_code: category.code,

            type_key: type.type_key,

            is_mandatory: type.is_mandatory,

            channels: {},

          };



          return (

            <NotificationPreferenceGroup

              key={`${category.code}:${type.type_key}`}

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

            />

          );

        })}

      </div>

    </section>

  );

}


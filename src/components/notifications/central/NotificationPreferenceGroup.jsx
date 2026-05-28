import NotificationChannelToggle from "./NotificationChannelToggle";
import NotificationEventRecipientRules from "./NotificationEventRecipientRules";
import "./NotificationPreferenceGroup.css";

export default function NotificationPreferenceGroup({
  type,
  pref,
  channelsMeta,
  savingPrefKey,
  savingRuleKey,
  recipientGroups,
  deliveryRules,
  onChannelChange,
  onEventRuleChange,
}) {
  if (!type) return null;

  const mandatory = Boolean(type.is_mandatory);
  const supported = new Set(
    (type.supported_channels?.length ? type.supported_channels : ["in_app", "email", "whatsapp"]).map(
      String
    )
  );

  return (
    <article className={`s7-npref-group ${mandatory ? "s7-npref-group--mandatory" : ""}`}>
      <header className="s7-npref-group__head">
        <div>
          <h4>{type.label}</h4>
          <p>{type.description}</p>
        </div>
        {mandatory ? <span className="s7-npref-group__badge">Obrigatória</span> : null}
      </header>

      {mandatory ? (
        <p className="s7-npref-group__mandatory-hint">
          Notificação obrigatória no app. E-mail e WhatsApp são definidos por destinatário abaixo.
        </p>
      ) : null}

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

      {(supported.has("email") || supported.has("whatsapp")) && (
        <NotificationEventRecipientRules
          categoryCode={pref.category_code}
          typeKey={pref.type_key}
          groups={recipientGroups}
          rules={deliveryRules}
          saving={Boolean(savingRuleKey)}
          onChange={onEventRuleChange}
        />
      )}
    </article>
  );
}

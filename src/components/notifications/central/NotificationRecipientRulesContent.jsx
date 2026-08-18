import { useMemo } from "react";
import S7Tooltip from "../../ui/S7Tooltip";
import "../center/notificationCenterVisualVariants.css";
import "./NotificationEventRecipientRules.css";

export const NOTIFICATION_INACTIVE_RECIPIENT_HINT =
  "Destinatário inativo. Ative-o na página Destinatários para alterar os canais.";

/**
 * @param {{
 *   label: string;
 *   gid: string;
 *   hasEmail: boolean;
 *   hasWa: boolean;
 *   isInactive: boolean;
 *   emailDisabled: boolean;
 *   waDisabled: boolean;
 *   emailChecked: boolean;
 *   waChecked: boolean;
 *   onToggle: (channel: "email" | "whatsapp", enabled: boolean) => void;
 *   compact?: boolean;
 * }} props
 */
function RecipientChannelFields({
  label,
  hasEmail,
  hasWa,
  isInactive,
  emailDisabled,
  waDisabled,
  emailChecked,
  waChecked,
  onToggle,
  compact = false,
}) {
  const emailLabel = isInactive ? `${label}: E-mail — ${NOTIFICATION_INACTIVE_RECIPIENT_HINT}` : `${label}: E-mail`;
  const waLabel = isInactive
    ? `${label}: WhatsApp — ${NOTIFICATION_INACTIVE_RECIPIENT_HINT}`
    : `${label}: WhatsApp`;

  const emailField = (
    <label
      className={`s7-nevent-rules__chip ${!hasEmail || isInactive ? "s7-nevent-rules__chip--disabled" : ""}`}
    >
      <input
        type="checkbox"
        disabled={emailDisabled}
        aria-disabled={emailDisabled}
        aria-label={emailLabel}
        checked={emailChecked}
        onChange={(e) => onToggle("email", e.target.checked)}
      />
      E-mail
    </label>
  );

  const waField = (
    <label
      className={`s7-nevent-rules__chip ${!hasWa || isInactive ? "s7-nevent-rules__chip--disabled" : ""}`}
    >
      <input
        type="checkbox"
        disabled={waDisabled}
        aria-disabled={waDisabled}
        aria-label={waLabel}
        checked={waChecked}
        onChange={(e) => onToggle("whatsapp", e.target.checked)}
      />
      WhatsApp
    </label>
  );

  if (compact) {
    return (
      <div className="s7-nevent-rules__recipient">
        <span className="s7-nevent-rules__name">
          {label}
          {isInactive ? <span className="s7-nevent-rules__inactive-badge">Inativo</span> : null}
        </span>
        <div className="s7-nevent-rules__channels">
          {emailField}
          {waField}
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="s7-nevent-rules__name">
        {label}
        {isInactive ? <span className="s7-nevent-rules__inactive-badge">Inativo</span> : null}
      </span>
      {emailField}
      {waField}
    </>
  );
}

/**
 * Lista de destinatários por canal — corpo reutilizável (sem expansor).
 */
export default function NotificationRecipientRulesContent({
  categoryCode,
  typeKey,
  groups,
  rules,
  saving,
  compact = false,
  recipientRowAccent = false,
  onChange,
}) {
  const ruleMap = useMemo(() => {
    const map = new Map();
    for (const r of rules ?? []) {
      if (String(r.category_code) !== categoryCode || String(r.type_key) !== typeKey) continue;
      map.set(`${r.recipient_group_id}:${r.channel}`, Boolean(r.enabled));
    }
    return map;
  }, [rules, categoryCode, typeKey]);

  const visibleGroups = groups ?? [];
  const hasAnyRecipient = visibleGroups.length > 0;
  const hasActiveRecipient = visibleGroups.some((g) => g.is_active !== false);

  if (!hasAnyRecipient) {
    return (
      <p className="s7-nevent-rules__hint">
        Cadastre destinatários na aba Destinatários para escolher quem recebe e-mail e WhatsApp.
      </p>
    );
  }

  const toggle = (groupId, channel, enabled) => {
    const group = visibleGroups.find((g) => String(g.group_id) === groupId);
    if (group?.is_active === false) return;

    onChange?.([
      {
        category_code: categoryCode,
        type_key: typeKey,
        recipient_group_id: groupId,
        channel,
        enabled,
      },
    ]);
  };

  const isEnabled = (groupId, channel, hasChannel) => {
    if (!hasChannel) return false;
    const key = `${groupId}:${channel}`;
    if (ruleMap.has(key)) return ruleMap.get(key);
    return false;
  };

  return (
    <>
      {!hasActiveRecipient ? (
        <p className="s7-nevent-rules__hint">Não há destinatários ativos para este evento.</p>
      ) : null}
      <div className="s7-nevent-rules__table" aria-label="Destinatários por canal">
        {visibleGroups.map((g) => {
          const gid = String(g.group_id);
          const isInactive = g.is_active === false;
          const hasEmail = Boolean(g.channels?.email?.destination);
          const hasWa = Boolean(g.channels?.whatsapp?.destination);
          const emailDisabled = saving || !hasEmail || isInactive;
          const waDisabled = saving || !hasWa || isInactive;

          const rowClassName = [
            "s7-nevent-rules__row",
            isInactive ? "s7-nevent-rules__row--inactive" : "",
            compact ? "s7-nevent-rules__row--compact" : "",
            recipientRowAccent && compact ? "s7-ncenter-recipient--left-accent-orange" : "",
            isInactive ? "s7-nevent-rules__row--inactive-tooltip-target" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const rowBody = (
            <div
              className={`s7-nevent-rules__row-content ${isInactive ? "s7-nevent-rules__row-content--inactive" : ""}`.trim()}
            >
              <RecipientChannelFields
                label={g.label}
                hasEmail={hasEmail}
                hasWa={hasWa}
                isInactive={isInactive}
                emailDisabled={emailDisabled}
                waDisabled={waDisabled}
                emailChecked={isEnabled(gid, "email", hasEmail)}
                waChecked={isEnabled(gid, "whatsapp", hasWa)}
                onToggle={(channel, enabled) => toggle(gid, channel, enabled)}
                compact={compact}
              />
            </div>
          );

          if (isInactive) {
            return (
              <S7Tooltip
                key={gid}
                content={NOTIFICATION_INACTIVE_RECIPIENT_HINT}
                wrap
                placement="top-start"
                offset={8}
                className="s7-nevent-rules__inactive-tooltip"
              >
                <div className={rowClassName} tabIndex={0} aria-disabled="true">
                  {rowBody}
                </div>
              </S7Tooltip>
            );
          }

          return (
            <div key={gid} className={rowClassName}>
              {rowBody}
            </div>
          );
        })}
      </div>
    </>
  );
}

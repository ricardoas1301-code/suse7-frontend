import { useMemo, useState } from "react";
import "./NotificationEventRecipientRules.css";

/**
 * @param {string} categoryCode
 * @param {string} typeKey
 * @param {Array<Record<string, unknown>>} groups
 * @param {Array<Record<string, unknown>>} rules
 * @param {boolean} saving
 * @param {(updates: Array<Record<string, unknown>>) => void | Promise<void>} onChange
 */
export default function NotificationEventRecipientRules({
  categoryCode,
  typeKey,
  groups,
  rules,
  saving,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const ruleMap = useMemo(() => {
    const map = new Map();
    for (const r of rules ?? []) {
      if (String(r.category_code) !== categoryCode || String(r.type_key) !== typeKey) continue;
      map.set(`${r.recipient_group_id}:${r.channel}`, Boolean(r.enabled));
    }
    return map;
  }, [rules, categoryCode, typeKey]);

  const hasSavedRules = useMemo(
    () =>
      (rules ?? []).some(
        (r) =>
          String(r.category_code) === categoryCode && String(r.type_key) === typeKey
      ),
    [rules, categoryCode, typeKey]
  );

  const activeGroups = (groups ?? []).filter((g) => g.is_active !== false);

  if (activeGroups.length === 0) {
    return (
      <div className="s7-nevent-rules s7-nevent-rules--empty">
        <p>Cadastre destinatários na aba Destinatários para escolher quem recebe este evento.</p>
      </div>
    );
  }

  const toggle = (groupId, channel, enabled) => {
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
    <div className="s7-nevent-rules">
      <div className="s7-nevent-rules__head">
        <button
          type="button"
          className="s7-nevent-rules__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "▼" : "▶"} Destinatários
        </button>
        {saving ? (
          <span className="s7-nevent-rules__status s7-nevent-rules__status--saving">Salvando...</span>
        ) : !hasSavedRules ? (
          <span className="s7-nevent-rules__status s7-nevent-rules__status--muted">Sem regras salvas</span>
        ) : (
          <span className="s7-nevent-rules__status">Regras salvas</span>
        )}
      </div>

      {open ? (
        <div className="s7-nevent-rules__table" role="group" aria-label="Destinatários por canal">
          {activeGroups.map((g) => {
            const gid = String(g.group_id);
            const hasEmail = Boolean(g.channels?.email?.destination);
            const hasWa = Boolean(g.channels?.whatsapp?.destination);
            return (
              <div key={gid} className="s7-nevent-rules__row">
                <span className="s7-nevent-rules__name">{g.label}</span>
                <label
                  className={`s7-nevent-rules__chip ${!hasEmail ? "s7-nevent-rules__chip--disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={saving || !hasEmail}
                    checked={isEnabled(gid, "email", hasEmail)}
                    onChange={(e) => toggle(gid, "email", e.target.checked)}
                  />
                  E-mail
                </label>
                <label
                  className={`s7-nevent-rules__chip ${!hasWa ? "s7-nevent-rules__chip--disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={saving || !hasWa}
                    checked={isEnabled(gid, "whatsapp", hasWa)}
                    onChange={(e) => toggle(gid, "whatsapp", e.target.checked)}
                  />
                  WhatsApp
                </label>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

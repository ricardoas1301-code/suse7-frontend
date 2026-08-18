import { useEffect, useMemo, useState } from "react";
import "../center/notificationCenterVisualVariants.css";
import NotificationRecipientRulesContent from "./NotificationRecipientRulesContent";
import NotificationCardFooter from "./NotificationCardFooter";
import NotificationEventRulesStatusBadge from "./NotificationEventRulesStatusBadge";
import "./NotificationEventRecipientRules.css";
import "./NotificationCardFooter.css";

/**
 * @param {string} categoryCode
 * @param {string} typeKey
 * @param {Array<Record<string, unknown>>} groups
 * @param {Array<Record<string, unknown>>} rules
 * @param {boolean} saving
 * @param {string} [expandLabel]
 * @param {boolean} [hideStatusBadge]
 * @param {boolean} [compact]
 * @param {boolean} [canonicalFooter]
 * @param {boolean} [recipientRowAccent]
 * @param {import("react").ReactNode} [scheduleSlot]
 * @param {(open: boolean) => void} [onExpandedChange]
 * @param {(updates: Array<Record<string, unknown>>) => void | Promise<void>} onChange
 */
export default function NotificationEventRecipientRules({
  categoryCode,
  typeKey,
  groups,
  rules,
  saving,
  expandLabel = "Destinatários",
  hideStatusBadge = false,
  compact = false,
  canonicalFooter = false,
  recipientRowAccent = false,
  scheduleSlot = null,
  onExpandedChange,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const panelId = `s7-nevent-rules-panel-${String(categoryCode)}-${String(typeKey)}`;

  useEffect(() => {
    onExpandedChange?.(open);
    return () => {
      onExpandedChange?.(false);
    };
  }, [open, onExpandedChange]);

  const hasSavedRules = useMemo(
    () =>
      (rules ?? []).some(
        (r) =>
          String(r.category_code) === categoryCode && String(r.type_key) === typeKey
      ),
    [rules, categoryCode, typeKey]
  );

  const visibleGroups = groups ?? [];
  const hasAnyRecipient = visibleGroups.length > 0;

  if (!hasAnyRecipient && !scheduleSlot) {
    return (
      <div className="s7-nevent-rules s7-nevent-rules--empty">
        <p>Cadastre destinatários na aba Destinatários para escolher quem recebe este evento.</p>
      </div>
    );
  }

  const toggleButton = (
    <button
      type="button"
      className="s7-nevent-rules__toggle"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-controls={panelId}
    >
      {open ? "▼" : "▶"} {expandLabel}
    </button>
  );

  const statusBadge =
    !hideStatusBadge ? (
      <NotificationEventRulesStatusBadge saving={saving} hasSavedRules={hasSavedRules} />
    ) : saving ? (
      <NotificationEventRulesStatusBadge saving hasSavedRules={false} />
    ) : null;

  const expandedPanel = open ? (
    <div
      id={panelId}
      role="group"
      aria-label={expandLabel}
      className={`s7-nevent-rules__panel s7-nevent-rules__panel--neutral ${canonicalFooter ? "s7-npref-group__footer-panel" : ""}`}
    >
      {scheduleSlot}
      <NotificationRecipientRulesContent
        categoryCode={categoryCode}
        typeKey={typeKey}
        groups={groups}
        rules={rules}
        saving={saving}
        compact={compact}
        recipientRowAccent={recipientRowAccent}
        onChange={onChange}
      />
    </div>
  ) : null;

  if (canonicalFooter) {
    return (
      <NotificationCardFooter
        actions={
          <>
            {toggleButton}
            {statusBadge}
          </>
        }
      >
        {expandedPanel}
      </NotificationCardFooter>
    );
  }

  return (
    <div className={`s7-nevent-rules ${compact ? "s7-nevent-rules--compact" : ""}`}>
      <div className="s7-nevent-rules__head">
        {toggleButton}
        {statusBadge}
      </div>
      {expandedPanel}
    </div>
  );
}

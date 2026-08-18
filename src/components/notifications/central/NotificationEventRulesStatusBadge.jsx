/**
 * Badge canônico de estado das regras de entrega por evento.
 */
export default function NotificationEventRulesStatusBadge({ saving, hasSavedRules }) {
  if (saving) {
    return (
      <span className="s7-nevent-rules__status s7-nevent-rules__status--saving" aria-live="polite">
        Salvando...
      </span>
    );
  }

  if (hasSavedRules) {
    return <span className="s7-nevent-rules__status">Regras salvas</span>;
  }

  return (
    <span className="s7-nevent-rules__status s7-nevent-rules__status--muted">Sem regras salvas</span>
  );
}

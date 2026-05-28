import "./NotificationChannelToggle.css";

export default function NotificationChannelToggle({
  channelKey,
  label,
  description,
  enabled,
  disabled,
  locked,
  future,
  saving,
  onChange,
}) {
  const isDisabled = disabled || locked || future || saving;

  return (
    <label
      className={`s7-nch-toggle ${enabled ? "s7-nch-toggle--on" : ""} ${isDisabled ? "s7-nch-toggle--disabled" : ""} ${future ? "s7-nch-toggle--future" : ""}`}
    >
      <input
        type="checkbox"
        checked={Boolean(enabled)}
        disabled={isDisabled}
        onChange={(e) => onChange?.(channelKey, e.target.checked)}
      />
      <span className="s7-nch-toggle__track" aria-hidden />
      <span className="s7-nch-toggle__copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
        {future ? <small className="s7-nch-toggle__soon">Em breve</small> : null}
        {locked ? <small className="s7-nch-toggle__locked">Canal mínimo obrigatório</small> : null}
      </span>
    </label>
  );
}

import "./S7DestructiveConfirmationChallenge.css";

/**
 * @param {{
 *   instruction: string;
 *   code: string;
 *   inputValue: string;
 *   onInputChange: (value: string) => void;
 *   inputDisabled?: boolean;
 *   error?: string | null;
 *   successMessage?: string | null;
 *   inputPlaceholder?: string;
 *   inputAriaLabel?: string;
 *   onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
 * }} props
 */
export default function S7DestructiveConfirmationChallenge({
  instruction,
  code,
  inputValue,
  onInputChange,
  inputDisabled = false,
  error = null,
  successMessage = null,
  inputPlaceholder = "Digite o código",
  inputAriaLabel = "Digite o código de confirmação",
  onInputKeyDown,
}) {
  return (
    <div className="s7-destructive-confirmation-challenge">
      <p className="s7-destructive-confirmation-challenge__instruction">{instruction}</p>
      <div className="s7-destructive-confirmation-challenge__row">
        <span className="s7-destructive-confirmation-challenge__code" aria-label="Código de confirmação">
          {code || "----"}
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className="s7-destructive-confirmation-challenge__input"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={inputPlaceholder}
          aria-label={inputAriaLabel}
          aria-invalid={Boolean(error)}
          disabled={inputDisabled}
        />
      </div>
      {error ? <p className="s7-destructive-confirmation-challenge__error">{error}</p> : null}
      {successMessage ? <p className="s7-destructive-confirmation-challenge__success">{successMessage}</p> : null}
    </div>
  );
}

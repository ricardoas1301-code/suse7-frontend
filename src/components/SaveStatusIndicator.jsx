// ======================================================================
// SUSE7 — SAVE STATUS INDICATOR (pill flutuante)
// Canto inferior direito, estilo premium
// Estados: saving (ampulheta), success (check), error (alert + retry)
// ======================================================================

import { useSaveStatus } from "../contexts/SaveStatusContext";
import "./SaveStatusIndicator.css";

function LoaderIcon() {
  return (
    <svg className="s7-save-status-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export default function SaveStatusIndicator() {
  const { getActive } = useSaveStatus();
  const active = getActive();

  if (!active) return null;

  const [key, { status, message, retry }] = active;

  if (status === "saving") {
    return (
      <div className="s7-save-status s7-save-status--saving" role="status" aria-live="polite">
        <LoaderIcon />
        <span>Salvando...</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="s7-save-status s7-save-status--success" role="status" aria-live="polite">
        <CheckIcon />
        <span>Salvo</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="s7-save-status s7-save-status--error" role="alert">
        <AlertIcon />
        <span>{message || "Falha ao salvar"}</span>
        {typeof retry === "function" && (
          <button type="button" className="s7-save-status-retry" onClick={retry}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return null;
}

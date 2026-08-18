const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/**
 * Ícone branco de estado da etapa — paridade visual com pill ativo do top nav (Vendas).
 * @param {{ status: string }} props
 */
export default function MarketplaceSyncStepStatusIcon({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  if (normalized === "done") {
    return (
      <svg {...ICON_PROPS}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (normalized === "error") {
    return (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }

  if (normalized === "running") {
    return (
      <svg {...ICON_PROPS} className="s7-marketplace-sync-details-modal__step-status-icon--running">
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    );
  }

  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

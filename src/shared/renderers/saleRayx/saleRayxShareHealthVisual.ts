// =============================================================================
// Saúde visual do Raio-X exportado — alinhado ao modal (sem recalcular finanças)
// =============================================================================

import { getSaleRayxMarginSemantic } from "../../../components/sales/saleRayxMarginSemantic.js";
import { resolveSaleRayxHealthState } from "../../../components/sales/saleRayxHealthState.js";

export type SaleHealthVisualTone = "critical" | "attention" | "healthy" | "unknown";

export type SaleHealthVisualState = {
  statusLabel: string;
  tone: SaleHealthVisualTone;
  accentColor: string;
  borderColor: string;
  valueColor: string;
  badgeColor: string;
  backgroundColor: string;
  kpiLabelColor: string;
  /** Alias de valueColor — compatibilidade */
  color: string;
};

const KPI_LABEL_COLOR = "#ff8533";

const PALETTE: Record<
  SaleHealthVisualTone,
  {
    accentColor: string;
    borderColor: string;
    valueColor: string;
    badgeColor: string;
    backgroundColor: string;
  }
> = {
  critical: {
    accentColor: "#ef4444",
    borderColor: "#ef4444",
    valueColor: "#dc2626",
    badgeColor: "#dc2626",
    backgroundColor: "rgba(255, 80, 80, 0.08)",
  },
  attention: {
    accentColor: "#f97316",
    borderColor: "#f97316",
    valueColor: "#ea580c",
    badgeColor: "#f97316",
    backgroundColor: "rgba(249, 115, 22, 0.06)",
  },
  healthy: {
    accentColor: "#22c55e",
    borderColor: "#22c55e",
    valueColor: "#16a34a",
    badgeColor: "#16a34a",
    backgroundColor: "rgba(34, 197, 94, 0.06)",
  },
  unknown: {
    accentColor: "#94a3b8",
    borderColor: "#e2e8f0",
    valueColor: "#64748b",
    badgeColor: "#64748b",
    backgroundColor: "rgba(248, 250, 252, 0.96)",
  },
};

function parseMarginPercent(marginPercentRaw: unknown): number | null {
  if (marginPercentRaw == null || String(marginPercentRaw).trim() === "") return null;
  const n = Number(String(marginPercentRaw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toneFromMargin(m: number | null): SaleHealthVisualTone {
  if (m == null) return "unknown";
  if (m < 0) return "critical";
  if (m <= 5) return "attention";
  return "healthy";
}

/**
 * Estado visual unificado (KPI shell + financial shell + resultado).
 * Faixas: &lt;0 crítico, 0–5 atenção, &gt;5 saudável.
 */
export function getSaleHealthVisualState(
  marginPercentRaw: unknown,
  statusLabelHint?: string | null,
): SaleHealthVisualState {
  const m = parseMarginPercent(marginPercentRaw);
  let tone = toneFromMargin(m);

  if (tone === "unknown" && marginPercentRaw != null) {
    const resolved = resolveSaleRayxHealthState(null, null, marginPercentRaw);
    if (resolved === "critical") tone = "critical";
    else if (resolved === "attention") tone = "attention";
    else if (resolved === "healthy") tone = "healthy";
  }

  const semantic = getSaleRayxMarginSemantic(marginPercentRaw);
  const statusLabel =
    statusLabelHint != null && String(statusLabelHint).trim() !== ""
      ? String(statusLabelHint).trim()
      : semantic.healthLabel != null && String(semantic.healthLabel).trim() !== ""
        ? String(semantic.healthLabel).trim()
        : "—";

  const palette = PALETTE[tone];
  return {
    statusLabel,
    tone,
    accentColor: palette.accentColor,
    borderColor: palette.borderColor,
    valueColor: palette.valueColor,
    badgeColor: palette.badgeColor,
    backgroundColor: palette.backgroundColor,
    kpiLabelColor: KPI_LABEL_COLOR,
    color: palette.valueColor,
  };
}

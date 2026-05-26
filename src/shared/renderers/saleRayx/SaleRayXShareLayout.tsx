// =============================================================================
// Layout estrutural do Raio-X compartilhável (espelha modal — dados prontos)
// =============================================================================

import type { SaleRayxSummaryRenderModel } from "../../../components/sales/saleRayxSummaryRender.js";
import {
  getSaleHealthVisualState,
  type SaleHealthVisualState,
} from "./saleRayxShareHealthVisual.js";

export type SaleRayXShareOutputMode = "whatsapp" | "copy" | "print";

export type SaleRayXSharePayload = {
  saleId: string;
  snapshotVersion: string;
  templateVersion: string;
  variant: string;
  productImage?: string | null;
  productImageSource?: string | null;
  marketplace?: string | null;
  marketplaceLabel?: string | null;
  marketplaceAccentColor?: string | null;
  listing?: string | null;
  health?: string | null;
  renderModel: SaleRayxSummaryRenderModel;
};

export type SaleRayXShareMetaValueTone = "neutral" | "accent";

export type ShareMetaField = {
  label?: string;
  value: string;
  valueTone?: SaleRayXShareMetaValueTone;
  accentColor?: string;
  truncateMode?: "twoLineEllipsis";
  /** Label em linha própria; valor alinhado abaixo (ex.: nome do anúncio) */
  labelOnOwnLine?: boolean;
  emphasis?: "bold";
};

export type ShareKpiCard = {
  label: string;
  value: string;
  valueColor: string;
};

export type ShareFinancialLine =
  | { kind: "blank" }
  | { kind: "section"; text: string }
  | { kind: "dotted" }
  | { kind: "field"; label: string; value: string }
  | {
      kind: "money";
      label: string;
      value: string;
      color: string;
      detail?: string;
      variant?: "default" | "resultado";
    }
  | { kind: "health"; value: string; variant: "resultado" }
  | { kind: "text"; text: string; color?: string };

export type ShareLayoutPlan = {
  metaFields: ShareMetaField[];
  kpiCards: ShareKpiCard[];
  healthVisual: SaleHealthVisualState;
  financialLines: ShareFinancialLine[];
  footerLines: string[];
};

/**
 * Monta plano de desenho a partir do renderModel (sem lógica financeira).
 */
export function buildShareLayoutPlan(
  payload: SaleRayXSharePayload,
  toneColor: (tone: string, marginRaw: unknown) => string,
): ShareLayoutPlan {
  const model = payload.renderModel;
  const lines = model.lines ?? [];

  const healthRow = lines.find((l) => l.kind === "health") as
    | { kind: "health"; value: string }
    | undefined;

  const healthVisual = getSaleHealthVisualState(
    model.marginPercentRaw,
    healthRow?.value ?? payload.health ?? null,
  );

  const metaFields: ShareMetaField[] = [];
  const financialLines: ShareFinancialLine[] = [];
  const footerLines: string[] = [];

  let inFinancial = false;
  let inFooter = false;
  let inResultado = false;

  let accountAlias: string | null = null;
  let listingSkuLine: string | null = null;
  let announcementName: string | null = null;
  let pedidoValue: string | null = null;
  let dataValue: string | null = null;
  let quantidadeValue: string | null = null;
  let clienteValue: string | null = null;

  for (const row of lines) {
    if (row.kind === "text" && String(row.text).includes("Gerado por Suse7")) {
      inFooter = true;
      inFinancial = false;
      inResultado = false;
    }
    if (inFooter) {
      if (row.kind === "text") footerLines.push(String(row.text));
      continue;
    }
    if (row.kind === "text" && String(row.text).includes("RECEITA DO MARKETPLACE")) {
      inFinancial = true;
      inResultado = false;
      financialLines.push({ kind: "section", text: String(row.text).replace(/^[^\w]*\s*/, "") });
      continue;
    }
    if (!inFinancial) {
      if (row.kind === "field") {
        const label = String(row.label ?? "");
        const value = String(row.value ?? "");
        if (label === "Conta marketplace") accountAlias = value;
        else if (label === "Anúncio") listingSkuLine = value;
        else if (label === "Produto") announcementName = value;
        else if (label === "Pedido") pedidoValue = value;
        else if (label === "Data da venda") dataValue = value;
        else if (label === "Quantidade") quantidadeValue = value;
        else if (label === "Cliente") clienteValue = value;
      }
      continue;
    }
    if (row.kind === "blank") {
      financialLines.push({ kind: "blank" });
      continue;
    }
    if (row.kind === "text") {
      const text = String(row.text);
      if (text.includes("RESULTADO")) {
        inResultado = true;
        financialLines.push({ kind: "dotted" });
        financialLines.push({ kind: "section", text: text.replace(/^[^\w]*\s*/, "") });
      } else if (text.includes("CUSTOS INTERNOS")) {
        inResultado = false;
        financialLines.push({ kind: "dotted" });
        financialLines.push({ kind: "section", text: text.replace(/^[^\w]*\s*/, "") });
      } else if (text.includes("Margem de contingência")) {
        financialLines.push({ kind: "section", text });
      } else {
        financialLines.push({ kind: "text", text });
      }
      continue;
    }
    if (row.kind === "money") {
      const isResultado =
        inResultado && (row.label === "Lucro" || row.label === "Margem");
      financialLines.push({
        kind: "money",
        label: row.label,
        value: row.value,
        color: isResultado ? healthVisual.valueColor : toneColor(row.tone, model.marginPercentRaw),
        detail: row.detail != null ? String(row.detail) : undefined,
        variant: isResultado ? "resultado" : "default",
      });
      continue;
    }
    if (row.kind === "health" && inResultado) {
      financialLines.push({
        kind: "health",
        value: String(row.value ?? healthVisual.statusLabel),
        variant: "resultado",
      });
      continue;
    }
  }

  const findMoney = (label: string) =>
    lines.find((l) => l.kind === "money" && l.label === label) as
      | { kind: "money"; label: string; value: string; tone: string }
      | undefined;

  const profit = findMoney("Lucro");
  const margin = findMoney("Margem");

  const kpiCards: ShareKpiCard[] = [
    {
      label: "Lucro (R$)",
      value: profit?.value ?? "—",
      valueColor: healthVisual.valueColor,
    },
    {
      label: "Margem (%)",
      value: margin?.value ?? "—",
      valueColor: healthVisual.valueColor,
    },
    {
      label: "Saúde da venda",
      value: healthVisual.statusLabel,
      valueColor: healthVisual.valueColor,
    },
  ];

  const marketplaceLabel = payload.marketplaceLabel ?? payload.marketplace ?? null;
  const marketplaceAccent = payload.marketplaceAccentColor ?? healthVisual.accentColor;

  if (accountAlias != null) {
    metaFields.push({ label: "Conta", value: accountAlias });
  }

  if (marketplaceLabel != null) {
    metaFields.push({
      label: "Marketplace",
      value: marketplaceLabel,
      valueTone: "accent",
      accentColor: marketplaceAccent,
    });
  }

  if (listingSkuLine != null) {
    metaFields.push({ value: listingSkuLine, emphasis: "bold" });
  }

  if (announcementName != null) {
    metaFields.push({
      label: "Anúncio",
      value: announcementName,
      truncateMode: "twoLineEllipsis",
      labelOnOwnLine: true,
    });
  }

  if (pedidoValue != null) metaFields.push({ label: "Pedido", value: pedidoValue });
  if (dataValue != null) metaFields.push({ label: "Data da venda", value: dataValue });
  if (quantidadeValue != null) metaFields.push({ label: "Quantidade", value: quantidadeValue });
  if (clienteValue != null) metaFields.push({ label: "Cliente", value: clienteValue });

  return { metaFields, kpiCards, healthVisual, financialLines, footerLines };
}

/** Componente reservado para preview/DOM futuro — não usado no canvas export. */
export function SaleRayXShareLayout(_props: { payload: SaleRayXSharePayload }) {
  return null;
}

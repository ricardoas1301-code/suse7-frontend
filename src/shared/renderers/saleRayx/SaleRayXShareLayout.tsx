// =============================================================================
// Layout estrutural do Raio-X compartilhável (espelha modal — dados prontos)
// =============================================================================

import type { SaleRayxSummaryRenderModel } from "../../../components/sales/saleRayxSummaryRender.js";

export type SaleRayXShareOutputMode = "whatsapp" | "copy" | "print";

export type SaleRayXSharePayload = {
  saleId: string;
  snapshotVersion: string;
  templateVersion: string;
  variant: string;
  productImage?: string | null;
  marketplace?: string | null; // legacy
  marketplaceLabel?: string | null;
  marketplaceAccentColor?: string | null;
  listing?: string | null;
  health?: string | null;
  renderModel: SaleRayxSummaryRenderModel;
};

export type SaleRayXShareMetaValueTone = "neutral" | "accent";

export type ShareMetaField = {
  label: string;
  value: string;
  valueTone?: SaleRayXShareMetaValueTone;
  accentColor?: string;
  truncateMode?: "twoLineEllipsis";
};
export type ShareKpiCard = { label: string; value: string; color: string };
export type ShareFinancialLine =
  | { kind: "blank" }
  | { kind: "section"; text: string }
  | { kind: "dotted" }
  | { kind: "field"; label: string; value: string }
  | { kind: "money"; label: string; value: string; color: string; detail?: string }
  | { kind: "text"; text: string; color?: string };

export type ShareLayoutPlan = {
  metaFields: ShareMetaField[];
  kpiCards: ShareKpiCard[];
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

  /** @type {ShareMetaField[]} */
  const metaFields = [];
  /** @type {ShareFinancialLine[]} */
  const financialLines = [];
  /** @type {string[]} */
  const footerLines = [];

  let inFinancial = false;
  let inFooter = false;

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
    }
    if (inFooter) {
      if (row.kind === "text") footerLines.push(String(row.text));
      continue;
    }
    if (row.kind === "text" && String(row.text).includes("RECEITA DO MARKETPLACE")) {
      inFinancial = true;
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
      if (text.includes("CUSTOS INTERNOS") || text.includes("RESULTADO")) {
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
      financialLines.push({
        kind: "money",
        label: row.label,
        value: row.value,
        color: toneColor(row.tone, model.marginPercentRaw),
        detail: row.detail != null ? String(row.detail) : undefined,
      });
      continue;
    }
    if (row.kind === "health") {
      continue;
    }
  }

  const findMoney = (label: string) =>
    lines.find((l) => l.kind === "money" && l.label === label) as
      | { kind: "money"; label: string; value: string; tone: string }
      | undefined;

  const profit = findMoney("Lucro");
  const margin = findMoney("Margem");
  const healthRow = lines.find((l) => l.kind === "health") as
    | { kind: "health"; value: string }
    | undefined;

  const kpiCards: ShareKpiCard[] = [
    {
      label: "Lucro",
      value: profit?.value ?? "—",
      color: toneColor(profit?.tone ?? "margin", model.marginPercentRaw),
    },
    {
      label: "Margem",
      value: margin?.value ?? "—",
      color: toneColor(margin?.tone ?? "margin", model.marginPercentRaw),
    },
    {
      label: "Saúde da venda",
      value: healthRow?.value ?? payload.health ?? "—",
      color: toneColor("margin", model.marginPercentRaw),
    },
  ];

  const marketplaceLabel = payload.marketplaceLabel ?? payload.marketplace ?? null;
  const marketplaceAccent = payload.marketplaceAccentColor ?? "#ff8533";

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
    metaFields.push({ label: "Anúncio", value: listingSkuLine });
  }

  if (announcementName != null) {
    metaFields.push({
      label: "Anúncio",
      value: announcementName,
      truncateMode: "twoLineEllipsis",
    });
  }

  if (pedidoValue != null) metaFields.push({ label: "Pedido", value: pedidoValue });
  if (dataValue != null) metaFields.push({ label: "Data da venda", value: dataValue });
  if (quantidadeValue != null)
    metaFields.push({ label: "Quantidade", value: quantidadeValue });
  if (clienteValue != null) metaFields.push({ label: "Cliente", value: clienteValue });

  return { metaFields, kpiCards, financialLines, footerLines };
}

/** Componente reservado para preview/DOM futuro — não usado no canvas export. */
export function SaleRayXShareLayout(_props: { payload: SaleRayXSharePayload }) {
  return null;
}

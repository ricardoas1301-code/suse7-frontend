// ======================================================================
// Canais de exportação — Vendas (derivado do catálogo global S7).
// ======================================================================

import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";

/** @typedef {'stub' | 'planned' | 'disabled'} VendasReportChannelStatus */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   status: VendasReportChannelStatus;
 *   futureKey: string;
 * }} VendasReportChannelDef
 */

/** @type {Record<string, string>} */
const VENDAS_REPORT_FUTURE_KEY_BY_ID = {
  whatsapp: "exportWhatsapp",
  email: "exportEmail",
  copy: "exportCopy",
  print: "exportPrint",
  csv: "exportCsv",
};

/** @type {readonly VendasReportChannelDef[]} */
export const VENDAS_REPORT_CHANNELS = S7_MODAL_SHARE_ACTION_ORDER.map((id) => ({
  id,
  label: S7_MODAL_SHARE_ACTION_LABELS[id],
  status: "stub",
  futureKey: VENDAS_REPORT_FUTURE_KEY_BY_ID[id] ?? `export${id}`,
}));

/** Capacidades futuras — apenas documentação/arquitetura (não executadas). */
export const VENDAS_REPORT_FUTURE_CAPABILITIES = [
  "multiSelectSales",
  "scheduledReports",
  "exportWhatsapp",
  "exportEmail",
  "exportCsv",
  "exportPrint",
  "exportPdf",
];

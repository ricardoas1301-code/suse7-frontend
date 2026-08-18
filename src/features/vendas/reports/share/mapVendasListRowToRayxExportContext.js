// ======================================================================
// Mapeia linha da listagem /vendas → contexto do export Raio-X (sem recálculo).
// ======================================================================

import { pickCatalogAccountFields } from "../../../../components/catalog/S7CatalogAccountCell.jsx";

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function mapVendasListRowToRayxExportContext(row) {
  if (!row || typeof row !== "object") {
    return {
      general: {},
      product: {},
      financial: {},
      profitMargin: {},
      listingTitle: null,
    };
  }

  const fin =
    row.financials != null && typeof row.financials === "object"
      ? /** @type {Record<string, unknown>} */ ({ ...row.financials })
      : {};

  if (row.product_cost_only_brl != null && fin.product_cost_only_brl == null) {
    fin.product_cost_only_brl = row.product_cost_only_brl;
  }

  const accountFields = pickCatalogAccountFields(row);
  const accountAlias =
    accountFields.accountAlias != null && String(accountFields.accountAlias).trim() !== ""
      ? String(accountFields.accountAlias).trim()
      : row.account_alias != null
        ? String(row.account_alias).trim()
        : row.ml_account_alias != null
          ? String(row.ml_account_alias).trim()
          : null;

  const saleNumber =
    row.sale_display_code != null && String(row.sale_display_code).trim() !== ""
      ? String(row.sale_display_code).trim()
      : row.external_order_id != null
        ? String(row.external_order_id).trim()
        : null;

  const productTitle =
    row.product_display_title != null && String(row.product_display_title).trim() !== ""
      ? String(row.product_display_title).trim()
      : null;

  const sku =
    row.sku_display != null && String(row.sku_display).trim() !== ""
      ? String(row.sku_display).trim()
      : row.product_sku_line != null
        ? String(row.product_sku_line).trim()
        : null;

  return {
    general: {
      sale_number: saleNumber,
      external_order_id: row.external_order_id ?? saleNumber,
      sale_date: row.sale_date ?? row.date_created_marketplace ?? row.created_at ?? null,
      buyer_display_name: row.buyer_display_name ?? null,
      account_alias: accountAlias,
      marketplace_label: row.marketplace_label ?? row.marketplace ?? null,
      sku_display: sku,
      sale_status_label: row.sale_status_label ?? null,
      sale_origin_label: row.sale_origin_label ?? null,
      fulfillment_display: row.fulfillment_display ?? null,
      fulfillment_label: row.fulfillment_label ?? null,
    },
    product: {
      sku_display: sku,
      title: productTitle,
    },
    financial: fin,
    profitMargin: {
      margin_percent: fin.margin_percent ?? null,
      profit_brl: fin.profit_brl ?? null,
      health_label: fin.health_label ?? null,
    },
    listingTitle: productTitle,
  };
}
